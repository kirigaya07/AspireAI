"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { trackOpenAIUsage, extractJSONFromText } from "@/lib/ai-helpers";

/**
 * Generate a technical interview quiz
 * @returns {Promise<Array>} Array of quiz questions
 */
export async function generateQuiz() {
  const user = await getAuthenticatedUserWith({
    select: {
      industry: true,
      skills: true,
    },
  });

  let text = null;
  try {
    const prompt = `
    You are a technical interviewer for a ${user.industry} role.
    
    Generate 10 challenging technical interview questions for a candidate ${
      user.skills?.length ? `with expertise in ${user.skills.join(", ")}` : ""
    }.
    
    Requirements:
    - Each question must be multiple choice with exactly 4 options (A, B, C, D)
    - Include a mix of conceptual and practical questions
    - Ensure questions test deep understanding, not just memorization
    - Make sure there is only one correct answer per question
    - Provide a detailed explanation for why the correct answer is right
    
    CRITICAL: Return ONLY the JSON object below. Do NOT include any explanatory text, reasoning, or additional content before or after the JSON. Start your response with { and end with }.
    
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
    `;

    text = await generateWithOpenAI(prompt);
    
    // Extract JSON from response - handle cases where AI includes explanatory text
    const cleanedText = extractJSONFromText(text);
    const quiz = JSON.parse(cleanedText);

    await trackOpenAIUsage(
      prompt,
      text,
      "interview",
      "Generated interview questions"
    );

    // Validate that questions array exists and has items
    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error("Invalid quiz format: questions array is missing or empty");
    }

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (text) {
      console.error("Raw response:", text);
    }
    throw new Error(`Failed to generate quiz questions: ${error.message}`);
  }
}

/**
 * Save quiz results and generate improvement tips
 * @param {Array} questions - Array of quiz questions
 * @param {Array} answers - Array of user answers
 * @param {number} score - User's score
 * @returns {Promise<Object>} Saved assessment object
 */
export async function saveQuizResult(questions, answers, score) {
  const user = await getAuthenticatedUser();

  // Validate inputs
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid questions data");
  }

  if (!answers || !Array.isArray(answers)) {
    throw new Error("Invalid answers data");
  }

  // Calculate score properly on server side as well for validation
  let correctCount = 0;
  let totalAnswered = 0;

  const questionResults = questions.map((q, index) => {
    const userAnswer = answers[index];
    const correctAnswer = q.correctAnswer;
    
    // Normalize answers for comparison
    const normalizedUserAnswer = userAnswer 
      ? String(userAnswer).trim() 
      : null;
    const normalizedCorrectAnswer = String(correctAnswer).trim();
    
    // Count answered questions
    if (normalizedUserAnswer !== null && normalizedUserAnswer !== undefined && normalizedUserAnswer !== "") {
      totalAnswered++;
    }
    
    // Check if answer is correct
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    if (isCorrect && normalizedUserAnswer !== null) {
      correctCount++;
    }

    return {
      question: q.question,
      answer: correctAnswer,
      userAnswer: userAnswer || "Not answered",
      isCorrect,
      explanation: q.explanation || "No explanation provided",
    };
  });

  // Recalculate score on server for accuracy
  const calculatedScore = totalAnswered > 0 
    ? Math.round((correctCount / totalAnswered) * 100) 
    : 0;

  // Use the calculated score if it differs significantly from the client score
  // (within 5% tolerance to account for rounding differences)
  const finalScore = Math.abs(calculatedScore - score) > 5 ? calculatedScore : score;

  // Get wrong answers (excluding unanswered questions for improvement tips)
  const wrongAnswers = questionResults.filter(
    (q) => !q.isCorrect && q.userAnswer !== "Not answered"
  );

  // Only generate improvement tips if there are wrong answers
  let improvementTip = "";
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      CONTEXT: The user is a ${user.industry} professional who answered these technical interview questions incorrectly:

      ${wrongQuestionsText}

      TASK: Create a personalized learning recommendation based on these knowledge gaps.
      
      REQUIREMENTS:
      1. Be specific and actionable - suggest exactly what topic to study
      2. Be encouraging and positive in tone
      3. Do NOT mention the specific mistakes or questions
      4. Focus ONLY on what skills/concepts to improve
      5. Maximum 2 sentences total
      6. Start with a phrase like "Consider focusing on..." or "You might benefit from..."
      
      EXAMPLE FORMAT:
      "Consider focusing on [specific technical concept from their industry]. Strengthening your knowledge in this area will help you tackle similar problems with confidence."
    `;

    try {
      improvementTip = await generateWithOpenAI(improvementPrompt);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Provide a fallback improvement tip if generation fails
      improvementTip =
        "Consider reviewing fundamental concepts in your field. Regular practice will help strengthen your knowledge.";
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: finalScore,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return {
      ...assessment,
      correctCount,
      totalAnswered,
      totalQuestions: questions.length,
    };
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

/**
 * Get all assessments for the authenticated user
 * @returns {Promise<Array>} Array of assessment objects
 */
export async function getAssessments() {
  const user = await getAuthenticatedUser();

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

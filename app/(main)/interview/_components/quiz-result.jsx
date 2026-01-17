import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto p-8 rounded-xl bg-background shadow-xl border border-border">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6 justify-center">
        <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
        <h1 className="text-2xl font-semibold text-primary">
          Your Quiz Results
        </h1>
      </div>

      {/* Score Section */}
      <div className="text-center mb-6">
        <h3 className="text-4xl font-bold text-primary">
          {typeof result.quizScore === 'number' ? result.quizScore.toFixed(0) : '0'}%
        </h3>
        <Progress
          value={typeof result.quizScore === 'number' ? result.quizScore : 0}
          className="w-full h-3 rounded-lg bg-muted-foreground"
        />
        <div className="mt-2 space-y-1">
          <p className="text-sm text-muted-foreground">
            {typeof result.quizScore === 'number' && result.quizScore >= 80
              ? "Excellent! Keep it up 💯"
              : typeof result.quizScore === 'number' && result.quizScore >= 50
              ? "Good job! Improve a bit 👍"
              : "Keep practicing! You'll do better next time 💪"}
          </p>
          {result.correctCount !== undefined && result.totalAnswered !== undefined && (
            <p className="text-xs text-muted-foreground">
              {result.correctCount} out of {result.totalAnswered} answered correctly
              {result.totalQuestions && result.totalQuestions !== result.totalAnswered && (
                <span className="block">({result.totalQuestions - result.totalAnswered} unanswered)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Improvement Tip */}
      {result.improvementTip && (
        <div className="p-4 bg-muted rounded-lg shadow-inner border border-border">
          <h4 className="text-sm font-semibold text-primary">
            Improvement Tip:
          </h4>
          <p className="text-sm text-muted-foreground">
            {result.improvementTip}
          </p>
        </div>
      )}

      {/* Questions Review */}
      <div className="space-y-4 mt-6">
        <h3 className="text-md font-medium text-primary">Question Review</h3>
        {result.questions.map((q, index) => (
          <div
            key={index}
            className="border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-transform transform hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-primary">{q.question}</p>
              {q.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Your Answer: {q.userAnswer}</p>
              {!q.isCorrect && <p>Correct Answer: {q.answer}</p>}
            </div>
            <div className="text-xs bg-muted p-2 rounded-md mt-3">
              <p className="text-primary font-medium">Explanation:</p>
              <p>{q.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Start New Quiz Button */}
      {!hideStartNew && (
        <CardFooter className="mt-6">
          <Button
            onClick={onStartNew}
            className="w-full bg-primary  font-bold py-3 rounded-lg transition-all hover:bg-primary/90 shadow-lg"
          >
            Start New Quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}

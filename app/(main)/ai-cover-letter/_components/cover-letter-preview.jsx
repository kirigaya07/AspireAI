"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" />,
});
import { Button } from "@/components/ui/button";
import { Save, Edit } from "lucide-react";
import { toast } from "sonner";
import { updateCoverLetter } from "@/actions/cover-letter";
import { useRouter } from "next/navigation";

const CoverLetterPreview = ({ content, id }) => {
  const [value, setValue] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateCoverLetter(id, value);
      toast.success("Cover letter updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex justify-end space-x-2">
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            "Cancel"
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
        {isEditing && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>
      <MDEditor
        value={value}
        onChange={setValue}
        preview={isEditing ? "edit" : "preview"}
        height={700}
      />
    </div>
  );
};

export default CoverLetterPreview;

// components/custom/GenerateSignForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- Schemas ---
const initialFormSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters."),
});
type InitialFormValues = z.infer<typeof initialFormSchema>;

const styleFormSchema = z.object({
  styleChoice: z.string().min(1, "Please choose a style option."),
});
type StyleFormValues = z.infer<typeof styleFormSchema>;

const compileFormSchema = z.object({
  snippet: z.string().min(10, "LaTeX code must be at least 10 characters."),
});
type CompileFormValues = z.infer<typeof compileFormSchema>;

// Schema for change suggestions (the new chatbox).
const updateFormSchema = z.object({
  changePrompt: z.string().min(5, "Your change suggestion must be at least 5 characters."),
});
type UpdateFormValues = z.infer<typeof updateFormSchema>;

// --- Component Props ---
type GenerateSignFormProps = {
  onPdfGenerated: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

// --- Component ---
export default function GenerateSignForm({
  onPdfGenerated,
  setLoading,
  setError,
}: GenerateSignFormProps) {
  // Manage our three phases: "initial", "style_choice", "edit"
  const [step, setStep] = useState<"initial" | "style_choice" | "edit">("initial");
  // Holds the suggestion text (styling options and questions)
  const [suggestionText, setSuggestionText] = useState<string>("");
  // Holds the generated LaTeX code
  const [generatedLaTeX, setGeneratedLaTeX] = useState<string>("");

  // --- Form Instances ---
  // Form for the initial prompt.
  const initialForm = useForm<InitialFormValues>({
    resolver: zodResolver(initialFormSchema),
    defaultValues: { prompt: "" },
  });

  // Form for the style choice.
  const styleForm = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: { styleChoice: "" },
  });

  // Form for editing & compiling the LaTeX code.
  const compileForm = useForm<CompileFormValues>({
    resolver: zodResolver(compileFormSchema),
    defaultValues: { snippet: generatedLaTeX },
  });

  // Form for providing update/change suggestions.
  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: { changePrompt: "" },
  });

  // Update the compile form when the generated LaTeX changes.
  useEffect(() => {
    compileForm.setValue("snippet", generatedLaTeX);
  }, [generatedLaTeX, compileForm]);

  // --- Handlers ---
  // Handler for the initial prompt submission.
  const onInitialSubmit = async (data: InitialFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "initial",
          content: data.prompt,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to get suggestion.");
        setLoading(false);
        return;
      }

      const result = await response.json();
      const suggestion = result.content?.[0]?.text;
      if (!suggestion) {
        setError("No suggestion returned from sign generator.");
        setLoading(false);
        return;
      }

      // Save the suggestion text and move to style choice phase.
      setSuggestionText(suggestion);
      setStep("style_choice");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during suggestion.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for the style choice submission.
  const onStyleSubmit = async (data: StyleFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "style_choice",
          content: data.styleChoice,
          conversation_id: "0", // Modify as needed.
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to generate LaTeX code.");
        setLoading(false);
        return;
      }

      const result = await response.json();
      const latexCode = result.content?.[0]?.text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        setLoading(false);
        return;
      }

      // Save the generated LaTeX and move to the edit phase.
      setGeneratedLaTeX(latexCode);
      setStep("edit");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during style choice.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for the compile (edit) submission.
  const onCompileSubmit = async (data: CompileFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/compile-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippet: data.snippet }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Compilation failed.");
        setLoading(false);
        return;
      }

      // Create a blob URL from the fetched PDF.
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      onPdfGenerated(url);
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during compilation.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for update suggestions submission.
  const onUpdateSubmit = async (data: UpdateFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "style_choice",
          content: data.changePrompt,
          conversation_id: "0", // Modify as needed.
        }),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to update LaTeX code.");
        setLoading(false);
        return;
      }

  
      const result = await response.json();
      const latexCode = result.content?.[0]?.text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        setLoading(false);
        return;
      }


      // Save the generated LaTeX and move to the edit phase.
      setGeneratedLaTeX(latexCode);
      setStep("edit");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during style choice.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Generate and Compile Sign</h1>

      {step === "initial" && (
        <Form {...initialForm}>
          <form onSubmit={initialForm.handleSubmit(onInitialSubmit)} className="space-y-4">
            <FormField
              control={initialForm.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter your sign prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Create a broken elevator sign."
                      {...field}
                      style={{ minHeight: "100px", width: "100%" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Get Suggestions</Button>
          </form>
        </Form>
      )}

      {step === "style_choice" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Styling Suggestions</h2>
            <Textarea
              value={suggestionText}
              readOnly
              style={{ minHeight: "200px", width: "100%" }}
            />
          </div>
          <Form {...styleForm}>
            <form onSubmit={styleForm.handleSubmit(onStyleSubmit)} className="space-y-4">
              <FormField
                control={styleForm.control}
                name="styleChoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Enter your preferred style option (e.g. "1")
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Generate LaTeX Code</Button>
            </form>
          </Form>
        </div>
      )}

      {step === "edit" && (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold">Edit and Compile LaTeX Code</h2>
          <Form {...compileForm}>
            <form onSubmit={compileForm.handleSubmit(onCompileSubmit)} className="space-y-4">
              <FormField
                control={compileForm.control}
                name="snippet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LaTeX Code</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Edit your LaTeX code here"
                        {...field}
                        style={{ minHeight: "300px", width: "100%" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Compile</Button>
            </form>
          </Form>

          <div className="border-t pt-4">
            <h3 className="text-xl font-semibold">Not Satisfied? Provide Change Suggestions</h3>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="changePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Suggestion</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Adjust the layout, change font size, etc."
                          {...field}
                          style={{ minHeight: "100px", width: "100%" }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Submit Changes</Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
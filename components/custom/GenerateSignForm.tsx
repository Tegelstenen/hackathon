"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// shadcn UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

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

const updateFormSchema = z.object({
  changePrompt: z
    .string()
    .min(5, "Your change suggestion must be at least 5 characters."),
});
type UpdateFormValues = z.infer<typeof updateFormSchema>;

// --- Component Props ---
type GenerateSignFormProps = {
  onPdfGenerated: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string | null) => void; // NEW
  setError: (error: string | null) => void;
};

// --- Component ---
export default function GenerateSignForm({
  onPdfGenerated,
  setLoading,
  setLoadingMessage,
  setError,
}: GenerateSignFormProps) {
  // Manage our three phases: "initial", "style_choice", "edit"
  const [step, setStep] = useState<"initial" | "style_choice" | "edit">(
    "initial"
  );
  // Holds the suggestion text (styling options and questions)
  const [suggestionText, setSuggestionText] = useState<string>("");
  // Holds the generated LaTeX code
  const [generatedLaTeX, setGeneratedLaTeX] = useState<string>("");

  // --- Form Instances ---
  const initialForm = useForm<InitialFormValues>({
    resolver: zodResolver(initialFormSchema),
    defaultValues: { prompt: "" },
  });

  const styleForm = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: { styleChoice: "" },
  });

  const compileForm = useForm<CompileFormValues>({
    resolver: zodResolver(compileFormSchema),
    defaultValues: { snippet: generatedLaTeX },
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: { changePrompt: "" },
  });

  // Sync the compile form whenever the generated LaTeX changes
  useEffect(() => {
    compileForm.setValue("snippet", generatedLaTeX);
  }, [generatedLaTeX, compileForm]);

  // --- Handlers ---
  // 1) Initial prompt
  const onInitialSubmit = async (data: InitialFormValues) => {
    setLoading(true);
    setLoadingMessage("Generating suggestions…");
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
        return;
      }

      const result = await response.json();
      const suggestion = result.content?.[0]?.text;
      if (!suggestion) {
        setError("No suggestion returned from sign generator.");
        return;
      }

      setSuggestionText(suggestion);
      setStep("style_choice");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during suggestion.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // 2) Style choice
  const onStyleSubmit = async (data: StyleFormValues) => {
    setLoading(true);
    setLoadingMessage("Generating LaTeX code…");
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
        return;
      }

      const result = await response.json();
      const latexCode = result.content?.[0]?.text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        return;
      }

      setGeneratedLaTeX(latexCode);
      setStep("edit");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during style choice.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // 3) Compile
  const onCompileSubmit = async (data: CompileFormValues) => {
    setLoading(true);
    setLoadingMessage("Compiling your PDF…");
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
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      onPdfGenerated(url);
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during compilation.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // 4) Update suggestions
  const onUpdateSubmit = async (data: UpdateFormValues) => {
    setLoading(true);
    setLoadingMessage("Updating LaTeX code…");
    setError(null);

    try {
      const response = await fetch("/api/generate-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "style_choice",
          content: data.changePrompt,
          conversation_id: "0",
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to update LaTeX code.");
        return;
      }

      const result = await response.json();
      const latexCode = result.content?.[0]?.text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        return;
      }

      setGeneratedLaTeX(latexCode);
      setStep("edit");
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during style choice.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // --- Render ---
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          {step === "initial" && "Step 1: Provide Your communication needs"}
          {step === "style_choice" && "Step 2: Choose a Style"}
          {step === "edit" && "Step 3: Edit & Compile"}
        </CardTitle>
        <CardDescription>
          {step === "initial" &&
            "Describe what you want your visual communications to convey so we can generate styling suggestions."}
          {step === "style_choice" &&
            "Choose a style based on the suggestions, or enter your own option."}
          {step === "edit" &&
            "Review the LaTeX, compile to PDF, or provide more suggestions to update."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-6">
        {/* STEP 1: INITIAL PROMPT */}
        {step === "initial" && (
          <Form {...initialForm}>
            <form
              onSubmit={initialForm.handleSubmit(onInitialSubmit)}
              className="space-y-4"
            >
              <FormField
                control={initialForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Create a 'broken elevator' poster."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Get Suggestions
              </Button>
            </form>
          </Form>
        )}

        {/* STEP 2: STYLE CHOICE */}
        {step === "style_choice" && (
          <>
            <div className="flex flex-col h-full">
              <Textarea value={suggestionText} readOnly className="resize-none h-full" />
            </div>
            <Separator />
            <Form {...styleForm}>
              <form onSubmit={styleForm.handleSubmit(onStyleSubmit)}>
                <div className="flex items-end space-x-2">
                  <FormField
                    control={styleForm.control}
                    name="styleChoice"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>
                          Enter your preferred style option:
                        </FormLabel>
                        <FormControl>
                          <Input {...field}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">
                    Generate LaTeX
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {/* STEP 3: EDIT & COMPILE */}
        {step === "edit" && (
          <>
            {/* Large LaTeX code area (similar proportions) */}
            <div className="flex flex-col h-full">
              <Form {...compileForm}>
                <form
                  onSubmit={compileForm.handleSubmit(onCompileSubmit)}
                  className="flex flex-col h-full"
                >
                  {/* Expand the text area to fill space */}
                  <FormField
                    control={compileForm.control}
                    name="snippet"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1 mb-4">
                        <FormControl className="flex-1">
                          <Textarea
                            placeholder="Edit your LaTeX code here"
                            className="resize-none h-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Single line at the bottom for the button */}
                  <Button type="submit" className="w-full">
                    Compile to PDF
                  </Button>
                </form>
              </Form>
            </div>

            <Separator />

            {/* Single-line form for changes (just like style choice) */}
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)}>
                <div className="flex items-end space-x-2">
                  <FormField
                    control={updateForm.control}
                    name="changePrompt"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>
                        Not satisfied? Provide more suggestions:
                        </FormLabel>
                        <FormControl>
                        <Input {...field}/>
                      </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">
                    Submit Changes
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
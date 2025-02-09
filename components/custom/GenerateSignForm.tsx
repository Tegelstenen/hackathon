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
  setLoadingMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
};

export default function GenerateSignForm({
  onPdfGenerated,
  setLoading,
  setLoadingMessage,
  setError,
}: GenerateSignFormProps) {
  // Step of the process
  const [step, setStep] = useState<"initial" | "style_choice" | "edit">(
    "initial"
  );

  // conversationId from the backend
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Holds the suggestion text (styling proposals from step 1).
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
    defaultValues: { snippet: "" },
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: { changePrompt: "" },
  });

  // Keep the compile form in sync with our current LaTeX
  useEffect(() => {
    compileForm.setValue("snippet", generatedLaTeX);
  }, [generatedLaTeX, compileForm]);

  /**
   * Helper that attempts to compile code, and auto-fixes on error.
   * We call this any time we get new LaTeX from the server.
   */
  const autoCompile = async (snippet: string, conversationId: string) => {
    setError(null);

    let currentSnippet = snippet;
    const maxTries = 5; // or remove if you want unlimited tries

    for (let attempt = 0; attempt < maxTries; attempt++) {
      try {
        setLoading(true);
        setLoadingMessage(
          attempt === 0
            ? "Compiling your PDF…"
            : "Fixing errors and re-compiling…"
        );

        // Try compiling
        const compileResponse = await fetch("/api/compile-latex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snippet: currentSnippet }),
        });

        if (compileResponse.ok) {
          // Compilation success!
          const blob = await compileResponse.blob();
          const url = window.URL.createObjectURL(blob);
          onPdfGenerated(url);
          // Update local snippet in case user wants to see the final version
          setGeneratedLaTeX(currentSnippet);
          break;
        } else {
          // Compiler error
          const errorResponse = await compileResponse.json();
          const compilerError =
            errorResponse.error || "LaTeX compilation failed.";

          console.warn("Compiler error:", compilerError);

          // If last attempt, just show error
          if (attempt === maxTries - 1) {
            setError(
              `Compilation still failing after ${maxTries} attempts: ${compilerError}`
            );
            break;
          }

          // Otherwise, ask the AI to fix it automatically
          const updatePrompt = `Fix the LaTeX code given this compiler error:\n\n${compilerError}`;

          const updateResponse = await fetch("/api/generate-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              request_type: "update",
              content: updatePrompt,
              conversation_id: conversationId,
              latex: currentSnippet,
            }),
          });

          if (!updateResponse.ok) {
            const updateErrorResp = await updateResponse.json();
            setError(
              updateErrorResp.error || "Failed to auto-fix LaTeX code via AI."
            );
            break;
          }

          const updateResult = await updateResponse.json();
          const updatedLatex = updateResult.content[0].text;

          if (!updatedLatex) {
            setError("No updated LaTeX code returned from sign generator.");
            break;
          }

          // Use the newly fixed snippet for the next attempt
          currentSnippet = updatedLatex;
        }
      } catch (err: any) {
        console.error(err);
        setError(`Unexpected error during compilation: ${err.message}`);
        break;
      } finally {
        setLoading(false);
        setLoadingMessage(null);
      }
    }
  };

  //
  // STEP 1: Handle "initial" submit
  //
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
      if (!result.conversation_id) {
        setError("No conversation_id returned from sign generator.");
        return;
      }

      setConversationId(result.conversation_id);

      const suggestion = result.content[0].text;
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

  //
  // STEP 2: Handle "style_choice" submit
  //
  const onStyleSubmit = async (data: StyleFormValues) => {
    if (!conversationId) {
      setError("No conversation ID. Please start over.");
      return;
    }

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
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to generate LaTeX code.");
        return;
      }

      const result = await response.json();
      const latexCode = result.content[0].text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        return;
      }

      // Immediately move to "edit" step
      setStep("edit");

      // *** AUTO-COMPILE RIGHT AWAY ***
      // we skip manual setGeneratedLaTeX if you want the user to see it only after success
      // but if you want them to see it in the text area, do so:
      setGeneratedLaTeX(latexCode);

      // Now call auto-compile
      await autoCompile(latexCode, conversationId);
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred while generating LaTeX.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  //
  // STEP 3 (Optional): Manual compile button
  //
  const onCompileSubmit = async (data: CompileFormValues) => {
    // If you want to keep the manual compile button, just call autoCompile here:
    if (!conversationId) {
      setError("No conversation ID. Please start over.");
      return;
    }
    await autoCompile(data.snippet, conversationId);
  };

  //
  // STEP 4: Manual update suggestions -> new LaTeX -> auto-compile
  //
  const onUpdateSubmit = async (data: UpdateFormValues) => {
    if (!conversationId) {
      setError("No conversation ID. Please start over.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Updating LaTeX code…");
    setError(null);

    try {
      const response = await fetch("/api/generate-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "update",
          content: data.changePrompt,
          conversation_id: conversationId,
          latex: generatedLaTeX,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Failed to update LaTeX code.");
        return;
      }

      const result = await response.json();
      const latexCode = result.content[0].text;
      if (!latexCode) {
        setError("No LaTeX code returned from sign generator.");
        return;
      }

      setStep("edit");
      // Put the new code into our state for user visibility
      setGeneratedLaTeX(latexCode);

      // *** AUTO-COMPILE RIGHT AWAY ***
      await autoCompile(latexCode, conversationId);
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during update.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // --- RENDER ---
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          {step === "initial" && "Step 1: Provide Your Communication Needs"}
          {step === "style_choice" && "Step 2: Choose a Style"}
          {step === "edit" && "Step 3: Review, Edit, or Manually Compile"}
        </CardTitle>
        <CardDescription>
          {step === "initial" &&
            "Describe what you want so we can generate styling suggestions."}
          {step === "style_choice" &&
            "Choose a style or type your own style instructions."}
          {step === "edit" &&
            "We will automatically compile. You can still tweak or recompile manually below."}
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
            {/* Show the AI suggestions */}
            <div className="flex flex-col h-full">
              <Textarea
                value={suggestionText}
                readOnly
                className="resize-none h-full"
              />
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
                        <FormLabel>Enter your preferred style option:</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Generate LaTeX</Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {/* STEP 3: EDIT & COMPILE */}
        {step === "edit" && (
          <>
            {/* Large LaTeX code area - user can see or tweak */}
            <div className="flex flex-col h-full">
              <Form {...compileForm}>
                <form
                  onSubmit={compileForm.handleSubmit(onCompileSubmit)}
                  className="flex flex-col h-full"
                >
                  <FormField
                    control={compileForm.control}
                    name="snippet"
                    render={({ field }) => (
                      <FormItem className="flex-1 mb-4">
                        <FormControl className="h-full">
                          <Textarea
                            placeholder="Review or tweak your LaTeX code here."
                            className="resize-none h-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional manual compile button */}
                  <Button type="submit" className="w-full">
                    Compile to PDF
                  </Button>
                </form>
              </Form>
            </div>

            <Separator />

            {/* Single-line form for further manual changes */}
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)}>
                <div className="flex items-end space-x-2">
                  <FormField
                    control={updateForm.control}
                    name="changePrompt"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Need more changes?</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit Changes</Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
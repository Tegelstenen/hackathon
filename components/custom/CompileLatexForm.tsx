"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  snippet: z.string().min(10, "LaTeX code must be at least 10 characters."),
});

type FormValues = z.infer<typeof formSchema>;

type CompileLatexFormProps = {
  onPdfGenerated: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export default function CompileLatexForm({
  onPdfGenerated,
  setLoading,
  setError,
}: CompileLatexFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { snippet: "" },
  });

  const onSubmit = async (data: FormValues) => {
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
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Compile LaTeX</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="snippet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LaTeX Code</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your LaTeX code here"
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
    </div>
  );
}
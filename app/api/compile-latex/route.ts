import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export async function POST(request: Request) {
  try {
    // 1. Extract LaTeX code from the request body.
    const { snippet } = await request.json();
    if (!snippet || snippet.length < 10) {
      return NextResponse.json({ error: "Snippet too short." }, { status: 400 });
    }

    // 2. Create a temporary directory.
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "latex-"));
    const texFilePath = path.join(tempDir, "main.tex");

    // 3. Write the LaTeX snippet to main.tex.
    await fs.writeFile(texFilePath, snippet);

    // 4. Build the Docker command using the leplusorg/latex image.
    // Mount the temp directory to /tmp in the container.
    const imagesPath = path.join(process.cwd(), "images");

    const dockerImage = "leplusorg/latex";
    const cmd = `docker run --rm -t --net=none -v ${tempDir}:/tmp -v ${imagesPath}:/tmp/images ${dockerImage} latexmk -outdir=/tmp -pdf /tmp/main.tex`;

    // 5. Execute the Docker command.
    await new Promise<void>((resolve, reject) => {
      exec(cmd, { cwd: tempDir }, (error, stdout, stderr) => {
        console.log("Docker stdout:", stdout);
        console.error("Docker stderr:", stderr);
        if (error) {
          // Pass along the stderr output so the user can see what went wrong.
          reject(new Error(stderr || "Compilation failed."));
        } else {
          resolve();
        }
      });
    });

    // 6. Read the compiled PDF file.
    const pdfPath = path.join(tempDir, "main.pdf");
    const pdfBuffer = await fs.readFile(pdfPath);

    // 7. (Optional) Clean up the temporary directory.
    // await fs.rm(tempDir, { recursive: true, force: true });

    // 8. Return the PDF as the response.
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    });
  } catch (err: any) {
    console.error("Error in API route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
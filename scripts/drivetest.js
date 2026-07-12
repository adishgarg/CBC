import { createFolder } from "../lib/drive/googledrive.ts";

export async function GET() {
  const folderId = await createFolder("Test Folder");
  return Response.json({ folderId });
}
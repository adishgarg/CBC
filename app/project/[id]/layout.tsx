import type { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";

interface ClientProjectLayoutProps {
  children: React.ReactNode;
}

interface GenerateMetadataProps {
  params: Promise<{ id: string }>;
}

async function getProjectMetadata(id: string) {
  await connectDB();

  const project = await Project.findById(id)
    .select("name description")
    .lean<{ name?: string; description?: string } | null>();

  if (!project?.name) {
    return null;
  }

  const title = project.name.trim();
  const description =
    project.description?.trim() || `${project.name}`;

  return { title, description };
}

export async function generateMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const projectMetadata = await getProjectMetadata(id);

    if (!projectMetadata) {
      return {
        title: "Project",
        description: "Client project view",
      };
    }

    return {
      title: projectMetadata.title,
      description: projectMetadata.description,
      openGraph: {
        title: projectMetadata.title,
        description: projectMetadata.description,
      },
      twitter: {
        card: "summary",
        title: projectMetadata.title,
        description: projectMetadata.description,
      },
      appleWebApp: {
        title: projectMetadata.title,
      },
    };
  } catch (error) {
    console.error("Error generating project metadata:", error);

    return {
      title: "Project",
      description: "Client project view",
    };
  }
}

export default function ClientProjectLayout({
  children,
}: ClientProjectLayoutProps) {
  return children;
}

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Hostify API",
      description: "API for managing files and downloading the Hostify engine.",
      version: "1.0.1"
    },
    paths: {
      "/api/files": {
        get: {
          summary: "List all files",
          description: "Gets the complete file index of the repository. No search parameters are supported, as search must be implemented on the client side.",
          responses: { 
            200: { 
              description: "Complete list of files in JSON format",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      count: { type: "integer" },
                      items: { 
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            type: { type: "string" },
                            path: { type: "string" },
                            size: { type: "integer" },
                            isImage: { type: "boolean" },
                            extension: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } 
          }
        }
      },
      "/api/template": {
        get: {
          summary: "Download Hostify Engine (.zip)",
          description: "Redirects to the latest version of the Hostify source code to replicate the node.",
          responses: { 302: { description: "Redirect to the GitHub zip" } }
        }
      }
    }
  };

  return new Response(JSON.stringify(spec), {
    headers: { 'Content-Type': 'application/json' }
  });
};

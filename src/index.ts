#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";

const API_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!API_KEY) {
  throw new Error("UNSPLASH_ACCESS_KEY environment variable is required");
}

const server = new McpServer({
  name: "unsplash-server",
  version: "0.1.0",
});

const unsplashApi = axios.create({
  baseURL: "https://api.unsplash.com",
  headers: {
    Authorization: `Client-ID ${API_KEY}`,
  },
});

server.tool(
  "download_unsplash_images",
  {
    query: z.string().describe("Search query for images"),
    orientation: z
      .enum(["vertical", "horizontal", "squarish"])
      .optional()
      .describe("Image orientation (vertical or horizontal)"),
    count: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .describe("Number of images to download (1-50)"),
    download_path: z
      .string()
      .optional()
      .describe("The path to download the images to."),
    filename: z
      .string()
      .optional()
      .describe(
        "The desired filename for the image(s). Extension is not needed."
      ),
  },
  async ({
    query,
    count = 5,
    download_path = "tmp",
    filename,
    orientation,
  }) => {
    try {
      const baseDir = process.cwd();
      if (path.isAbsolute(download_path)) {
        throw new Error(
          "download_path must be a relative path within the current workspace"
        );
      }
      const targetDir = path.resolve(baseDir, download_path);
      const baseReal = fs.realpathSync(baseDir);
      if (
        targetDir !== baseReal &&
        !targetDir.startsWith(`${baseReal}${path.sep}`)
      ) {
        throw new Error(
          "download_path resolves outside the current workspace"
        );
      }
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const params: any = {
        query,
        per_page: count,
        page: randomPage,
      };
      if (orientation) {
        params.orientation =
          orientation === "vertical"
            ? "portrait"
            : orientation === "horizontal"
            ? "landscape"
            : "squarish";
      }
      const response = await unsplashApi.get("/search/photos", {
        params,
      });

      const images = response.data.results;
      const downloadPromises = images.map(async (image: any, index: number) => {
        const imageUrl = image.urls.regular;
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const slugify = (str: string) =>
          str
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");

        let imageName;
        if (filename) {
          const name = filename.replace(/\.[^/.]+$/, ""); // remove extension if present
          imageName = `${slugify(name)}-${image.id}.jpg`;
        } else {
          imageName = `${slugify(query)}-${image.id}.jpg`;
        }

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const targetReal = fs.realpathSync(targetDir);
        if (
          targetReal !== baseReal &&
          !targetReal.startsWith(`${baseReal}${path.sep}`)
        ) {
          throw new Error(
            "download_path resolves outside the current workspace"
          );
        }
        const ensureUniquePath = (dir: string, name: string) => {
          const ext = path.extname(name);
          const base = path.basename(name, ext);
          let candidate = path.join(dir, name);
          let counter = 1;
          while (fs.existsSync(candidate)) {
            candidate = path.join(dir, `${base}-${counter}${ext}`);
            counter += 1;
          }
          return candidate;
        };

        const imagePath = ensureUniquePath(targetDir, imageName);
        fs.writeFileSync(imagePath, imageResponse.data);
        return `Downloaded ${path.basename(imagePath)}`;
      });

      const downloadResults = await Promise.all(downloadPromises);

      return {
        content: [
          {
            type: "text",
            text: downloadResults.join("\n"),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: "text",
              text: `Unsplash API error: ${
                error.response?.data.errors?.[0] ?? error.message
              }`,
            },
          ],
          isError: true,
        };
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Unhandled error in download_unsplash_images: ${errorMessage}`
      );
      return {
        content: [
          {
            type: "text",
            text: `An unexpected error occurred: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Unsplash MCP server running on stdio");

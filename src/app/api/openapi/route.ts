import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "CampusCode REST API Documentation",
      version: "1.0.0",
      description: "Production API for CampusCode platform: Online Judge, College ERP, Contests, LMS & Developer Community",
    },
    servers: [
      {
        url: "https://campus-code-virid.vercel.app/api",
        description: "Production Server",
      },
      {
        url: "http://localhost:3000/api",
        description: "Local Development Server",
      },
    ],
    paths: {
      "/auth?action=login": {
        post: {
          summary: "User Authentication Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "student@sarhad.edu" },
                    password: { type: "string", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful with JWT" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/problems": {
        get: {
          summary: "Get All Coding Problems",
          parameters: [
            { name: "difficulty", in: "query", schema: { type: "string" } },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "Paginated list of problems" },
          },
        },
      },
      "/execute": {
        post: {
          summary: "Execute Source Code via Judge0 CE",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    source_code: { type: "string" },
                    language_id: { type: "integer", example: 62 },
                    stdin: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Judge0 stdout/stderr/verdict result" },
          },
        },
      },
      "/submissions": {
        post: {
          summary: "Submit Final Problem Solution",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    problem_id: { type: "string", format: "uuid" },
                    language: { type: "string", example: "java" },
                    source_code: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Submission evaluation result" },
          },
        },
      },
      "/contests": {
        get: { summary: "List All Coding Contests" },
        post: { summary: "Create New Coding Contest" },
      },
      "/courses": {
        get: { summary: "List LMS Courses" },
        post: { summary: "Create Course (Teacher/Admin)" },
      },
      "/discussions": {
        get: { summary: "List Community Discussions" },
        post: { summary: "Create Discussion Post" },
      },
      "/articles": {
        get: { summary: "List Technical Articles" },
        post: { summary: "Publish Article" },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}

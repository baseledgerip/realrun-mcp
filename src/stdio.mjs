#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.mjs";
await createServer({ transport: "stdio" }).connect(new StdioServerTransport());

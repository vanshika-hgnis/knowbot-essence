// src/types/notebook.ts
import type { Database } from "./database.types";

export type Notebook = Database["public"]["Tables"]["notebooks"]["Row"];

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function listFilesRecursive(dir, exts, out = []) {
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(full, exts, out);
      continue;
    }
    if (exts.some((ext) => full.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function normalizePath(p) {
  const withLeading = p.startsWith("/") ? p : `/${p}`;
  if (withLeading.length > 1 && withLeading.endsWith("/")) {
    return withLeading.slice(0, -1);
  }
  return withLeading;
}

function joinRoute(base, route) {
  const joined = `${base.replace(/\/$/, "")}/${route.replace(/^\//, "")}`;
  return joined === "" ? "/" : joined.replace(/\/+/g, "/");
}

function toRegexPattern(routePattern) {
  const withParamTokens = routePattern.replace(/:[A-Za-z0-9_]+/g, "__PARAM__");
  const escaped = withParamTokens
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/__PARAM__/g, "[^/]+")
    .replace(/\\\*+/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function resolveApiRoutes() {
  const serverPath = path.join(repoRoot, "apps", "api", "src", "server.ts");
  const serverContent = readFile(serverPath);

  const importMap = new Map();
  const importRegex = /import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+["'](\.\/modules\/[^"']+\.js)["'];/g;
  for (const match of serverContent.matchAll(importRegex)) {
    const routerVar = match[1];
    const relModuleJs = match[2];
    const relTs = relModuleJs.replace(/\.js$/, ".ts");
    const abs = path.join(path.dirname(serverPath), relTs);
    importMap.set(routerVar, abs);
  }

  const mountMap = new Map();
  const mountRegex = /app\.use\((["'`])([^"'`]+)\1,\s*([A-Za-z0-9_]+)\s*\);/g;
  for (const match of serverContent.matchAll(mountRegex)) {
    const base = normalizePath(match[2]);
    const routerVar = match[3];
    if (!mountMap.has(routerVar)) {
      mountMap.set(routerVar, []);
    }
    mountMap.get(routerVar).push(base);
  }

  const routes = [];

  const resourceMountRegex = /app\.use\((["'`])([^"'`]+)\1,\s*createResourceRouter\((["'`])([^"'`]+)\3\)\s*\);/g;
  for (const match of serverContent.matchAll(resourceMountRegex)) {
    const base = normalizePath(match[2]);
    routes.push({ method: "GET", path: normalizePath(joinRoute(base, "/")), source: "apps/api/src/modules/resources/routes.ts" });
    routes.push({ method: "POST", path: normalizePath(joinRoute(base, "/")), source: "apps/api/src/modules/resources/routes.ts" });
    routes.push({ method: "PUT", path: normalizePath(joinRoute(base, "/:resourceId")), source: "apps/api/src/modules/resources/routes.ts" });
    routes.push({ method: "DELETE", path: normalizePath(joinRoute(base, "/:resourceId")), source: "apps/api/src/modules/resources/routes.ts" });
  }

  const directRegex = /app\.(get|post|put|patch|delete)\((["'`])([^"'`]+)\2/g;
  for (const match of serverContent.matchAll(directRegex)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: normalizePath(match[3]),
      source: "apps/api/src/server.ts"
    });
  }

  const routeRegex = /([A-Za-z0-9_]+)\.(get|post|put|patch|delete)\((["'`])([^"'`]+)\3/g;
  for (const [routerVar, modulePath] of importMap.entries()) {
    if (!exists(modulePath)) continue;
    const moduleContent = readFile(modulePath);
    const mounts = mountMap.get(routerVar) ?? [];
    if (mounts.length === 0) continue;

    for (const match of moduleContent.matchAll(routeRegex)) {
      const routerInFile = match[1];
      if (routerInFile !== routerVar) continue;
      const method = match[2].toUpperCase();
      const routePath = normalizePath(match[4]);
      for (const mount of mounts) {
        routes.push({
          method,
          path: normalizePath(joinRoute(mount, routePath)),
          source: path.relative(repoRoot, modulePath).replace(/\\/g, "/")
        });
      }
    }
  }

  return routes;
}

function extractAdminWebCalls() {
  const calls = [];
  const srcDir = path.join(repoRoot, "apps", "admin-web", "src");
  const files = listFilesRecursive(srcDir, [".ts", ".tsx"]);

  for (const file of files) {
    const content = readFile(file);

    const requestRegex = /requestJson(?:<[^>]*>)?\(\s*"(GET|POST|PUT|PATCH|DELETE)"\s*,\s*(["'`])([^"'`]+)\2/g;
    for (const m of content.matchAll(requestRegex)) {
      const endpoint = m[3];
      if (!endpoint.startsWith("/")) continue;
      calls.push({
        app: "admin-web",
        method: m[1].toUpperCase(),
        path: endpoint,
        file: path.relative(repoRoot, file).replace(/\\/g, "/")
      });
    }

    const fetchRegex = /fetch\(\s*`\$\{getApiBaseUrl\(\)\}([^`]+)`\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g;
    for (const m of content.matchAll(fetchRegex)) {
      const endpoint = m[1];
      if (!endpoint.startsWith("/")) continue;
      const options = m[2] ?? "";
      const methodMatch = options.match(/method\s*:\s*"(GET|POST|PUT|PATCH|DELETE)"/);
      calls.push({
        app: "admin-web",
        method: (methodMatch?.[1] ?? "GET").toUpperCase(),
        path: endpoint,
        file: path.relative(repoRoot, file).replace(/\\/g, "/")
      });
    }
  }

  return calls;
}

function extractDartClientCalls(appFolderName, appLabel) {
  const calls = [];
  const libDir = path.join(repoRoot, "apps", appFolderName, "lib");
  const files = listFilesRecursive(libDir, [".dart"]);

  for (const file of files) {
    const content = readFile(file);
    const regex = /_client\.(get|post|put|patch|delete)\((["'`])([^"'`]+)\2/g;
    for (const m of content.matchAll(regex)) {
      const endpoint = m[3];
      if (!endpoint.startsWith("/")) continue;
      calls.push({
        app: appLabel,
        method: m[1].toUpperCase(),
        path: endpoint,
        file: path.relative(repoRoot, file).replace(/\\/g, "/")
      });
    }
  }

  return calls;
}

function pathToMatcherPath(frontendPath) {
  return frontendPath
    .replace(/\$\{[^}]+\}/g, "__param__")
    .replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, "__param__");
}

function buildBackendMatchers(routes) {
  return routes.map((route) => ({
    ...route,
    regex: toRegexPattern(route.path)
  }));
}

function validateCalls(calls, backendMatchers) {
  const issues = [];
  for (const call of calls) {
    const normalized = pathToMatcherPath(normalizePath(call.path));
    const methodMatches = backendMatchers.filter((b) => b.method === call.method && b.regex.test(normalized));
    if (methodMatches.length === 0) {
      const anyMethodMatches = backendMatchers.filter((b) => b.regex.test(normalized));
      if (anyMethodMatches.length > 0) {
        issues.push({
          kind: "method_mismatch",
          call,
          hint: `Backend has ${anyMethodMatches.map((x) => x.method).join(", ")} for ${call.path}`
        });
      } else {
        issues.push({
          kind: "missing_endpoint",
          call,
          hint: "No matching API route found"
        });
      }
    }
  }
  return issues;
}

function checkBaseUrlWiring() {
  const checks = [];

  const adminApi = path.join(repoRoot, "apps", "admin-web", "src", "core", "api.ts");
  const parentApiClient = path.join(repoRoot, "apps", "parents-app", "lib", "core", "api_client.dart");
  const driverApiClient = path.join(repoRoot, "apps", "driver-mobile", "lib", "core", "api_client.dart");

  if (exists(adminApi)) {
    const content = readFile(adminApi);
    checks.push({
      name: "admin-web VITE_API_BASE_URL",
      ok: content.includes("VITE_API_BASE_URL") && content.includes("http://localhost:4000")
    });
  }

  if (exists(parentApiClient)) {
    const content = readFile(parentApiClient);
    checks.push({
      name: "parents-app API_BASE_URL",
      ok: content.includes("String.fromEnvironment('API_BASE_URL'") && content.includes("http://localhost:4000")
    });
  }

  if (exists(driverApiClient)) {
    const content = readFile(driverApiClient);
    checks.push({
      name: "driver-mobile API_BASE_URL",
      ok: content.includes("String.fromEnvironment('API_BASE_URL'") && content.includes("http://localhost:4000")
    });
  }

  return checks;
}

function main() {
  const requiredPaths = [
    path.join(repoRoot, "apps", "api", "src", "server.ts"),
    path.join(repoRoot, "apps", "admin-web", "src", "core", "api.ts"),
    path.join(repoRoot, "apps", "parents-app", "lib", "core", "api_client.dart")
  ];

  const missingRequired = requiredPaths.filter((p) => !exists(p));
  if (missingRequired.length > 0) {
    console.error("Wiring scan failed: required files missing:");
    for (const p of missingRequired) {
      console.error(` - ${path.relative(repoRoot, p).replace(/\\/g, "/")}`);
    }
    process.exit(1);
  }

  const apiRoutes = resolveApiRoutes();
  const backendMatchers = buildBackendMatchers(apiRoutes);

  const calls = [
    ...extractAdminWebCalls(),
    ...extractDartClientCalls("parents-app", "parents-app"),
    ...extractDartClientCalls("driver-mobile", "driver-mobile")
  ];

  const issues = validateCalls(calls, backendMatchers);
  const baseUrlChecks = checkBaseUrlWiring();
  const failedBaseChecks = baseUrlChecks.filter((x) => !x.ok);

  console.log("Wiring Scan Summary");
  console.log("-------------------");
  console.log(`API routes detected: ${apiRoutes.length}`);
  console.log(`Frontend API calls detected: ${calls.length}`);
  console.log(`Base URL checks: ${baseUrlChecks.length}`);

  if (failedBaseChecks.length > 0) {
    console.log("\nBase URL wiring issues:");
    for (const check of failedBaseChecks) {
      console.log(` - ${check.name}`);
    }
  }

  if (issues.length > 0) {
    console.log("\nRoute wiring issues:");
    for (const issue of issues) {
      console.log(` - [${issue.kind}] ${issue.call.app} ${issue.call.method} ${issue.call.path}`);
      console.log(`   file: ${issue.call.file}`);
      console.log(`   hint: ${issue.hint}`);
    }
  }

  if (issues.length === 0 && failedBaseChecks.length === 0) {
    console.log("\nAll scanned apps appear correctly wired to API routes.");
    process.exit(0);
  }

  process.exit(1);
}

main();

---
name: Background removal dependency
description: Compatibility constraint between the image background-removal package and its ONNX web runtime.
---

The image background-removal dependency currently requires the exact `onnxruntime-web` 1.21.0 peer version. Installing a newer runtime causes npm dependency resolution to fail.

**Why:** The imported project declared a newer ONNX runtime than the background-removal package accepts, preventing dependencies and the Replit workflow from starting.

**How to apply:** Keep the runtime pinned to the package's supported peer version unless the background-removal package is upgraded together with a verified compatibility check.
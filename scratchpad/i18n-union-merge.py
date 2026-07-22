#!/usr/bin/env python3
"""Resolve an i18n JSON rebase/merge conflict by DEEP UNION of both sides.

Usage: run inside the conflicted worktree:
  i18n-union-merge.py <path-to-conflicted.json>

Reads git stage :2 (ours/HEAD) and :3 (theirs/incoming) for the file, deep-merges
them (recursively unioning objects; on a LEAF-value collision it keeps 'theirs' and
logs a warning), writes the merged valid JSON back to the working file, and
`git add`s it. Preserves key order (ours first, then theirs-only keys appended).
Exits non-zero on any real leaf collision so the caller can review.
"""
import json, subprocess, sys, collections

if len(sys.argv) != 2:
    print("usage: i18n-union-merge.py <file>", file=sys.stderr); sys.exit(2)
path = sys.argv[1]

def stage(n):
    r = subprocess.run(["git", "show", f":{n}:{path}"], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"cannot read stage {n} of {path}: {r.stderr}", file=sys.stderr); sys.exit(3)
    return json.loads(r.stdout, object_pairs_hook=collections.OrderedDict)

collisions = []

def deep_union(ours, theirs, trail=""):
    if isinstance(ours, dict) and isinstance(theirs, dict):
        out = collections.OrderedDict()
        for k, v in ours.items():
            if k in theirs:
                out[k] = deep_union(v, theirs[k], f"{trail}.{k}")
            else:
                out[k] = v
        for k, v in theirs.items():
            if k not in ours:
                out[k] = v
        return out
    # leaf level (or type mismatch)
    if ours == theirs:
        return ours
    # empty-object placeholder on one side -> take the populated side
    if ours in ({}, "", None):
        return theirs
    if theirs in ({}, "", None):
        return ours
    collisions.append(f"{trail}: ours={ours!r} theirs={theirs!r} -> kept theirs")
    return theirs

merged = deep_union(stage(2), stage(3))
with open(path, "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
    f.write("\n")
subprocess.run(["git", "add", path], check=True)

if collisions:
    print("LEAF COLLISIONS (review):")
    for c in collisions:
        print("  " + c)
    sys.exit(1)
print(f"union-merged cleanly: {path}")

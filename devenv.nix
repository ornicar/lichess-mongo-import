{
  pkgs,
  lib,
  config,
  ...
}:
{
  # https://devenv.sh/languages/
  languages.javascript.enable = true;
  languages.typescript.enable = true;

  # Node.js runtime for running TypeScript scripts.
  packages = [ pkgs.nodejs ];

  # ts-node: package not found in nixpkgs; add it to the project dependencies in package.json.

  # See full reference at https://devenv.sh/reference/options/
}

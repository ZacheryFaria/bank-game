{
  description = "Bank Game - Multiplayer idle financial game";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js 24 LTS
            nodejs_24

            # Package manager
            pnpm

            # Database
            postgresql_16

            # Development tools
            git
          ];

          shellHook = ''
            echo "Bank Game Development Environment"
            echo "Node.js version: $(node --version)"
            echo "pnpm version: $(pnpm --version)"
            echo "PostgreSQL version: $(postgres --version | head -n1)"
            echo ""
            echo "Run 'pnpm install' in backend/ and frontend/ to get started"
          '';
        };
      }
    );
}

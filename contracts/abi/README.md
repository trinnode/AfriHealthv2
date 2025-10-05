# Contract ABIs

This directory contains the Application Binary Interfaces (ABIs) for all AfriHealth smart contracts.

## Structure

Each facet has its own ABI JSON file that defines:
- Function signatures
- Event definitions
- Parameter types
- Return types

## Usage

These ABIs are used by the frontend and backend to interact with the deployed smart contracts on Hedera.

The Diamond contract address will be provided after deployment, and all facets will be accessible through that single address using their respective ABIs.

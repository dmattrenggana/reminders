import vaultAbi from "./vaultAbi.json";

export const VAULT_ABI = vaultAbi;
export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT as string;
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as string;

import { VaultDeployer } from "@/lib/contracts/vault-deployer"

export default function DeployPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <VaultDeployer />
      </div>
    </div>
  )
}

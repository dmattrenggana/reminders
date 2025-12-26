"use client"

import { useState, useEffect } from "react"
import { X, Coins, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ClaimRewardPopupProps {
  isOpen: boolean
  onClose: () => void
  onClaim: () => Promise<void>
  estimatedReward: string
  neynarScore: number
  isClaiming: boolean
}

export function ClaimRewardPopup({
  isOpen,
  onClose,
  onClaim,
  estimatedReward,
  neynarScore,
  isClaiming,
}: ClaimRewardPopupProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClaim = async () => {
    setIsProcessing(true)
    try {
      await onClaim()
      // Don't close immediately - let parent handle success state
    } catch (error) {
      console.error('[ClaimRewardPopup] Claim error:', error)
      // Error handling is done in parent
    } finally {
      setIsProcessing(false)
    }
  }

  const scorePercent = Math.floor(neynarScore * 100)
  const tier = scorePercent >= 90 ? "HIGH" : scorePercent >= 50 ? "MEDIUM" : "LOW"
  const tierColor = scorePercent >= 90 ? "text-green-600" : scorePercent >= 50 ? "text-blue-600" : "text-orange-600"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-[420px] p-6 rounded-[2.5rem] shadow-2xl border-slate-100 bg-white relative animate-in slide-in-from-bottom-10 duration-500">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isProcessing || isClaiming}
          className="absolute top-4 right-4 rounded-full hover:bg-slate-100 text-slate-600 h-8 w-8"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-center text-slate-800 mb-2">
          Post Verified! 🎉
        </h3>

        {/* Description */}
        <p className="text-sm text-center text-slate-600 mb-6">
          Your reminder post has been verified successfully!
        </p>

        {/* Reward Info */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 mb-6 border border-indigo-100">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Coins className="w-6 h-6 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
              Estimated Reward
            </span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-black text-indigo-700 mb-1">
              {estimatedReward || "0"}
            </div>
            <div className="text-xs font-semibold text-indigo-600">
              RMND Tokens
            </div>
          </div>

          {/* Neynar Score */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-indigo-200">
            <span className="text-slate-600 font-semibold">Neynar Score:</span>
            <span className={`font-black ${tierColor}`}>
              {scorePercent}% ({tier} Tier)
            </span>
          </div>
        </div>

        {/* Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={isProcessing || isClaiming}
          className="w-full py-6 rounded-xl font-black text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing || isClaiming ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Claiming Reward...
            </>
          ) : (
            <>
              <Coins className="w-5 h-5 mr-2" />
              Claim Reward
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-center text-slate-500 mt-4">
          Confirm the transaction in your wallet to receive your reward
        </p>
      </Card>
    </div>
  )
}


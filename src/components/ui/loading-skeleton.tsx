'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RadarChartSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <Skeleton className="h-8 w-64 bg-white/20" />
      </CardHeader>
      <CardContent>
        <div className="h-96 flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Circular grid skeleton */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-full"></div>
            <div className="absolute inset-4 border border-white/10 rounded-full"></div>
            <div className="absolute inset-8 border border-white/10 rounded-full"></div>
            <div className="absolute inset-12 border border-white/10 rounded-full"></div>
            
            {/* Radial lines skeleton */}
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-px h-40 bg-white/10 origin-bottom"
                style={{
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DimensionScoresSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <Skeleton className="h-8 w-48 bg-white/20" />
        <Skeleton className="h-4 w-96 bg-white/10 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 bg-white/20" />
                <Skeleton className="h-6 w-12 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-20 bg-white/10" />
                <div className="flex-1 bg-gray-700 rounded-full h-3 relative">
                  <Skeleton className="h-3 w-1/3 bg-white/20 rounded-full absolute left-1/2" />
                </div>
                <Skeleton className="h-4 w-20 bg-white/10" />
              </div>
              <Skeleton className="h-3 w-64 bg-white/10" />
              <Skeleton className="h-3 w-48 bg-white/10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function PropagandaAnalysisSkeleton() {
  return (
    <Card className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-yellow-900/20 backdrop-blur-sm border-orange-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">⚠️</span>
          <Skeleton className="h-8 w-80 bg-white/20" />
        </div>
        <Skeleton className="h-4 w-96 bg-white/10 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overall score skeleton */}
          <div className="text-center">
            <Skeleton className="h-12 w-16 bg-white/20 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 bg-white/10 mx-auto" />
          </div>
          
          {/* Individual scores skeleton */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-6 w-8 bg-white/20 rounded" />
              </div>
              <Skeleton className="h-2 w-full bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
        
        {/* Techniques skeleton */}
        <div className="mt-6">
          <Skeleton className="h-6 w-48 bg-white/20 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-3">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SimilarVibesSkeleton() {
  return (
    <div className="lg:col-span-2">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <Skeleton className="h-8 w-32 bg-white/20" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/20 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FullAnalysisSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <RadarChartSkeleton />
        <DimensionScoresSkeleton />
        <SimilarVibesSkeleton />
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = "default", className = "" }: { size?: "sm" | "default" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12"
  }
  
  return (
    <div className={`inline-block animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]} ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  )
}
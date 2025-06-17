'use client'

import React, { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void
  className?: string
}

export function CameraCapture({ onCapture, className }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot()
    if (image) {
      setImageSrc(image)
    }
  }, [webcamRef])

  const retake = () => {
    setImageSrc(null)
  }

  const confirm = () => {
    if (imageSrc) {
      onCapture(imageSrc)
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {!imageSrc ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode,
                width: 1280,
                height: 720,
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
          </>
        ) : (
          <img
            src={imageSrc}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4 flex justify-center gap-3">
        {!imageSrc ? (
          <>
            <Button
              onClick={toggleCamera}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Ganti Kamera
            </Button>
            <Button
              onClick={capture}
              size="lg"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              Ambil Foto
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={retake}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Ulangi
            </Button>
            <Button
              onClick={confirm}
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-5 h-5 mr-2" />
              Gunakan Foto
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
// src/components/ui/Error.js
'use client';

/**
 * ErrorMessage component displays a stylized error message within a card.
 * It optionally includes a retry button to allow users to attempt to rectify the error.
 * Features an alert icon, title, and detailed message to inform the user of the error encountered.
 */

import { AlertTriangle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export const ErrorMessage = ({ 
  title = 'Error', 
  message, 
  retry,
  className 
}) => (
  <Card className={`p-6 bg-destructive/10 text-destructive ${className}`}>
    <div className="flex flex-col items-center gap-4 text-center">
      <AlertTriangle size={32} />
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        {retry && (
          <Button 
            onClick={retry}
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  </Card>
);
// src/components/wallet/CredentialsForm.js
import { Button } from '@/components/ui/Button';
import { SecurityNotice } from '@/components/common/SecurityNotice';
import { PasswordField } from '../common/FormField';

export function CredentialsForm({ 
  credentials, 
  onChange, 
  onSubmit, 
  isLoading, 
  error,
  walletAddress 
}) {
  return (
    <div className="space-y-6">
      <div className="mb-6 p-4 bg-blue-900/20 rounded-lg">
        <p className="text-muted-foreground text-sm">
          Wallet restored successfully! Set up your account credentials to continue.
          Your address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Username
          </label>
          <input
            type="text"
            value={credentials.username}
            onChange={e => onChange({ ...credentials, username: e.target.value })}
            className="w-full bg-background border border-input rounded-lg p-3 
              text-foreground placeholder-muted-foreground focus:outline-none 
              focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Password
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={e => onChange({ ...credentials, password: e.target.value })}
            className="w-full bg-background border border-input rounded-lg p-3 
              text-foreground placeholder-muted-foreground focus:outline-none 
              focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Create a strong password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={credentials.confirmPassword}
            onChange={e => onChange({ ...credentials, confirmPassword: e.target.value })}
            className="w-full bg-background border border-input rounded-lg p-3 
              text-foreground placeholder-muted-foreground focus:outline-none 
              focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Confirm your password"
          />
        </div>

        {error && <SecurityNotice type="error">{error}</SecurityNotice>}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Complete Setup'}
        </Button>
      </form>
    </div>
  );
}
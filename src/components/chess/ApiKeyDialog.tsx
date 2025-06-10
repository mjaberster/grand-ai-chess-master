
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Lock, Loader2 } from 'lucide-react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onApiKeySubmit: (apiKey: string) => Promise<void>;
  onCancel: () => void;
}

const ApiKeyDialog = ({ isOpen, onApiKeySubmit, onCancel }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onApiKeySubmit(apiKey.trim());
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onCancel()}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-amber-400" />
            OpenAI API Key Required
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            To start playing chess with AI opponents, please enter your OpenAI API key. 
            Your key will be stored securely and only used for this chess game.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-white">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-700">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Security Information</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Your API key is encrypted before storage</li>
              <li>• Only used for OpenAI chess AI requests</li>
              <li>• Never shared with third parties</li>
              <li>• You can remove it anytime from your profile</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Start Game'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;

'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Pencil, Trash } from 'lucide-react';
import { useVoices } from '@/hooks/use-voices';
import { useVoiceStore } from '@/store/use-voice-store';
import { useState } from 'react';

export function TwilioIntegration() {
  const { twilioInfo } = useVoices();
  const setTwilioInfo = useVoiceStore((state) => state.setTwilioInfo);
  
  const [newAccount, setNewAccount] = useState({
    account_sid: '',
    auth_token: '',
    from_phone_number: '',
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);

  const addTwilioAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id || !newAccount.account_sid || !newAccount.auth_token || !newAccount.from_phone_number) {
        console.error('Missing required fields');
        return;
      }

      const { data, error } = await supabase
        .from('twilio_credentials')
        .insert([{
          account_sid: newAccount.account_sid,
          auth_token: newAccount.auth_token,
          from_phone_number: newAccount.from_phone_number,
          user_id: user.id
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setTwilioInfo([...twilioInfo, data[0]]);
        setNewAccount({ account_sid: '', auth_token: '', from_phone_number: '' });
        setIsPopoverOpen(false);
      }
    } catch (error) {
      console.error('Error adding Twilio account:', error);
    }
  };

  const deleteTwilioAccount = async (id: number) => {
    try {
      const { error } = await supabase
        .from('twilio_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTwilioInfo(twilioInfo.filter((account) => account.id !== id));
    } catch (error) {
      console.error('Error deleting Twilio account:', error);
    }
  };

  const updateTwilioAccount = async (updatedAccount: any) => {
    try {
      const { error } = await supabase
        .from('twilio_credentials')
        .update({
          account_sid: updatedAccount.account_sid,
          auth_token: updatedAccount.auth_token,
          from_phone_number: updatedAccount.from_phone_number,
        })
        .eq('id', updatedAccount.id);

      if (error) throw error;

      setTwilioInfo(
        twilioInfo.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
      );
      setEditMode(null);
    } catch (error) {
      console.error('Error updating Twilio account:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Twilio Integration</h2>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button className="mb-4">Add Twilio Account</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              value={newAccount.account_sid}
              onChange={(e) => setNewAccount({ ...newAccount, account_sid: e.target.value })}
              placeholder="Enter Account SID"
              className="border p-2 w-full"
            />
            <input
              type="text"
              value={newAccount.auth_token}
              onChange={(e) => setNewAccount({ ...newAccount, auth_token: e.target.value })}
              placeholder="Enter Auth Token"
              className="border p-2 w-full"
            />
            <input
              type="text"
              value={newAccount.from_phone_number}
              onChange={(e) => setNewAccount({ ...newAccount, from_phone_number: e.target.value })}
              placeholder="Enter From Number"
              className="border p-2 w-full"
            />
            <Button onClick={addTwilioAccount} className="w-full flex items-center gap-2">
              <Icon name="plus" className="h-4 w-4" />
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-1 gap-4">
        {twilioInfo.map((account) => (
          <div key={account.id} className="p-4 border rounded-md shadow-lg flex justify-between items-center">
            <div className="flex-1">
              {editMode === account.id ? (
                <div>
                  <div className="flex items-center mb-2">
                    <strong className="mr-2">SID:</strong>
                    <input
                      type="text"
                      value={account.account_sid}
                      onChange={(e) => updateTwilioAccount({ ...account, account_sid: e.target.value })}
                      className="border p-1 w-full rounded"
                    />
                  </div>
                  <div className="flex items-center mb-2">
                    <strong className="mr-2">Token:</strong>
                    <input
                      type="text"
                      value={account.auth_token}
                      onChange={(e) => updateTwilioAccount({ ...account, auth_token: e.target.value })}
                      className="border p-1 w-full rounded"
                    />
                  </div>
                  <div className="flex items-center">
                    <strong className="mr-2">From:</strong>
                    <input
                      type="text"
                      value={account.from_phone_number}
                      onChange={(e) => updateTwilioAccount({ ...account, from_phone_number: e.target.value })}
                      className="border p-1 w-full rounded"
                    />
                  </div>
                  <Button
                    onClick={() => updateTwilioAccount(account)}
                    className="mt-2"
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <strong className="mr-2">From:</strong>
                    <span className="text-sm text-gray-700">{account.from_phone_number}</span>
                  </div>
                  <Button
                    onClick={() => setEditMode(account.id)}
                    className="mt-2"
                  >
                    <Pencil className='h-4 w-4 mr-2' />
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <Button
              onClick={() => deleteTwilioAccount(account.id)}
              size="icon"
              className="bg-red-400 hover:bg-red-500 ml-2"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

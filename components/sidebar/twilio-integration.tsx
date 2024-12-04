import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DeleteIcon, Pencil, Trash } from 'lucide-react';

export function TwilioIntegration() {
  const [twilioAccounts, setTwilioAccounts] = useState([
    { id: '', account_sid: '', auth_token: '', from_phone_number: '' }
  ]);
  const [newAccount, setNewAccount] = useState({
    account_sid: '',
    auth_token: '',
    from_phone_number: '',
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('twilio_credentials').select('*');
    if (error) console.error('Error fetching accounts:', error);
    else setTwilioAccounts(data);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const addTwilioAccount = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }

    const newTwilioIntegration = {
      account_sid: newAccount.account_sid,
      auth_token: newAccount.auth_token,
      from_phone_number: newAccount.from_phone_number,
      user_id: userId
    };

    if (newAccount.account_sid && newAccount.auth_token && newAccount.from_phone_number && userId) {
      const { data, error } = await supabase.from('twilio_credentials').insert([
        newTwilioIntegration,
      ]).select();

      console.log('Inserted account:', data[0]);

      if (error) {
        console.error('Error adding account:', error);
      } else if(data && data.length > 0){ 
        setTwilioAccounts([...twilioAccounts, data[0]]);
        setNewAccount({ account_sid: '', auth_token: '', from_phone_number: '' });
        setIsPopoverOpen(false);
        fetchAccounts(); // Refresh the list
      }
      
    } else {
      console.error('User ID is missing or account details are incomplete.');
    }
  };

  const deleteTwilioAccount = async (id: string) => {
    const { error } = await supabase.from('twilio_credentials').delete().eq('id', id);
    if (error) {
      console.error('Error deleting account:', error);
    } else {
      setTwilioAccounts(twilioAccounts.filter((account) => account.id !== id));
    }
  };

  const updateTwilioAccount = async (updatedAccount: any) => {
    const { error } = await supabase
      .from('twilio_credentials')
      .update(updatedAccount)
      .eq('id', updatedAccount.id);
    if (error) {
      console.error('Error updating account:', error);
    } else {
      setTwilioAccounts(
        twilioAccounts.map((account) => (account.id === updatedAccount.id ? updatedAccount : account))
      );
    }
  };

  const saveUpdatedAccount = async (account: any) => {
    const { error } = await supabase
      .from('twilio_credentials')
      .update({
        account_sid: account.account_sid,
        auth_token: account.auth_token,
        from_phone_number: account.from_phone_number,
      })
      .eq('id', account.id);

    if (error) {
      console.error('Error updating account:', error);
    } else {
      setTwilioAccounts(
        twilioAccounts.map((acc) => (acc.id === account.id ? account : acc))
      );
      setEditMode(null);
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
        {twilioAccounts.map((account) => (
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
                    onClick={() => saveUpdatedAccount(account)}
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

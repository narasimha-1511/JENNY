import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { TwilioForm } from "./twilio-form";

interface TwilioCredential {
  id: number;
  account_sid: string;
  auth_token: string;
  from_phone_number: string;
}

export function TwilioIntegration() {
  const [credentials, setCredentials] = useState<TwilioCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<
    TwilioCredential | undefined
  >();

  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("twilio_credentials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Twilio credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete these credentials?")) return;

    try {
      await supabase.from("twilio_credentials").delete().eq("id", id);
      toast({
        title: "Success",
        description: "Twilio credentials deleted successfully",
      });
      fetchCredentials();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Twilio credentials",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icon name="loader" className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (showForm || editingCredential) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <TwilioForm
          credential={editingCredential}
          onSuccess={() => {
            setShowForm(false);
            setEditingCredential(undefined);
            fetchCredentials();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCredential(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Twilio Integration</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add New Credentials
        </Button>
      </div>

      {credentials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <Icon name="phone" className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No Twilio Credentials
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your Twilio credentials.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="mt-4"
          >
            Add Credentials
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account SID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {credentials.map((credential) => (
                <tr key={credential.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credential.account_sid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credential.from_phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCredential(credential)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(credential.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

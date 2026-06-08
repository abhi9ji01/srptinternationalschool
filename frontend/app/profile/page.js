"use client";
import { useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  async function saveProfile(e) {
    e.preventDefault();
    try {
      await api.put("/profile", { name, phone });
      setUser({ ...user, name });
      toast.success("Profile updated");
    } catch (e) { toast.error(e.message); }
  }
  async function changePassword(e) {
    e.preventDefault();
    try {
      await api.post("/auth/change-password", pwd);
      toast.success("Password changed");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="My Profile">
      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
        <TabsContent value="profile">
          <Card><CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="space-y-2"><Label>Role</Label><Input value={ROLE_LABELS[user?.role] || ""} disabled /></div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card><CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></div>
                <div className="space-y-2"><Label>New Password</Label><Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /></div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

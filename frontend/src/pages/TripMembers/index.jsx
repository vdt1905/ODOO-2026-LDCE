import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Crown, MailPlus, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { Button, ErrorState, Input, LoadingState } from '../../components/ui/index.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const TripMembersPage = () => {
  const { id } = useParams();
  usePageTitle('Trip collaborators');
  const currentUser = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, error: null, trip: null, members: [] });
  const [invite, setInvite] = useState({ email: '', role: 'editor' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const [tripData, memberData] = await Promise.all([tripApi.get(id), tripApi.members.list(id)]);
      setState({ loading: false, error: null, trip: tripData.trip, members: memberData.items });
    } catch (error) { setState((old) => ({ ...old, loading: false, error: toApiError(error) })); }
  }, [id]);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  const isOwner = String(state.trip?.user) === String(currentUser?._id);
  const inviteMember = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const data = await tripApi.members.invite(id, invite);
      setState((old) => ({ ...old, members: data.items }));
      setInvite({ email: '', role: 'editor' });
    } catch (error) { setState((old) => ({ ...old, error: toApiError(error) })); }
    finally { setSaving(false); }
  };
  const setRole = async (member, role) => {
    try { const data = await tripApi.members.update(id, member.user._id, { role }); setState((old) => ({ ...old, members: data.items })); }
    catch (error) { setState((old) => ({ ...old, error: toApiError(error) })); }
  };
  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.user.firstName} from this trip?`)) return;
    try { const data = await tripApi.members.remove(id, member.user._id); setState((old) => ({ ...old, members: data.items })); }
    catch (error) { setState((old) => ({ ...old, error: toApiError(error) })); }
  };

  if (state.loading) return <section className="mx-auto max-w-4xl px-4 py-10"><LoadingState label="Loading your collaborators" /></section>;
  if (state.error && !state.trip) return <section className="mx-auto max-w-4xl px-4 py-10"><ErrorState error={state.error} retry={load} /></section>;

  return <section className="mx-auto max-w-4xl px-4 pb-16">
    <Button to={`/trips/${id}`} variant="ghost" size="sm" leftIcon={<ChevronLeft className="size-4" />}>Itinerary</Button>
    <div className="mt-4"><p className="text-sm text-clay-600">Plan together</p><h1 className="mt-1 font-display text-4xl font-semibold">Trip collaborators</h1><p className="mt-2 text-sm text-ink-500">Editors can build the route. Viewers can follow the itinerary, budget, and map.</p></div>
    {state.error && <div className="mt-5 rounded-2xl border border-clay-200 bg-clay-50 p-3 text-sm text-clay-700">{state.error.message}</div>}
    {isOwner && <form className="mt-7 rounded-4xl border border-moss-100 bg-moss-50 p-6 shadow-soft" onSubmit={inviteMember}><div className="flex items-center gap-2"><MailPlus className="size-5 text-moss-800" /><h2 className="font-display text-2xl font-semibold">Invite a collaborator</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]"><Input wrapperClassName="mb-0" aria-label="Collaborator email" type="email" placeholder="friend@example.com" value={invite.email} onChange={(event) => setInvite((old) => ({ ...old, email: event.target.value }))} required /><select aria-label="Collaborator role" className="h-12 rounded-2xl border border-line bg-surface px-4 text-sm" value={invite.role} onChange={(event) => setInvite((old) => ({ ...old, role: event.target.value }))}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button type="submit" loading={saving}>Invite</Button></div><p className="mt-3 text-xs text-ink-500">They need an existing GlobeTrotter account with this email address.</p></form>}
    <section className="mt-6 rounded-4xl border border-line bg-surface p-6 shadow-soft"><div className="flex items-center gap-2"><UsersRound className="size-5 text-clay-500" /><h2 className="font-display text-2xl font-semibold">Who has access</h2></div><div className="mt-5 divide-y divide-line">{state.members.map((member) => <div key={member.user._id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"><Avatar user={member.user} className="size-10 text-sm" /><div className="min-w-40 flex-1"><strong className="block text-sm">{member.user.firstName} {member.user.lastName}</strong><span className="text-xs text-ink-500">{member.user.email}</span></div>{member.role === 'owner' ? <span className="inline-flex items-center gap-1 rounded-full bg-clay-50 px-3 py-1 text-xs font-medium text-clay-700"><Crown className="size-3" />Owner</span> : isOwner ? <><select aria-label={`Role for ${member.user.firstName}`} className="h-9 rounded-full border border-line bg-canvas px-3 text-xs" value={member.role} onChange={(event) => setRole(member, event.target.value)}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><button type="button" onClick={() => remove(member)} className="rounded-xl p-2 text-clay-600 hover:bg-clay-50" aria-label={`Remove ${member.user.firstName}`}><Trash2 className="size-4" /></button></> : <span className="inline-flex items-center gap-1 rounded-full bg-canvas-deep px-3 py-1 text-xs font-medium text-ink-700"><ShieldCheck className="size-3" />{member.role}</span>}</div>)}</div></section>
  </section>;
};

export default TripMembersPage;

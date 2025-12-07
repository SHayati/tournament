'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const t = useTranslations('Auth');
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // @ts-ignore
    const isAdmin = session?.user?.isAdmin;

    useEffect(() => {
        fetch('/api/users')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const toggleAdmin = async (id: string, currentStatus: boolean) => {
        if (!isAdmin) return;
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: !currentStatus })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === id ? { ...u, isAdmin: !currentStatus } : u));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteUser = async (id: string) => {
        if (!isAdmin) return;
        if (!confirm(t('delete') + '?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const addUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail) return;

        setIsAdding(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUserEmail, name: newUserName }),
            });

            if (res.ok) {
                const addedUser = await res.json();
                setUsers([addedUser, ...users]);
                setNewUserEmail('');
                setNewUserName('');
                // Optional: show userAdded message
            } else if (res.status === 409) {
                alert(t('exists'));
            } else {
                alert(t('errorAdding'));
            }
        } catch (error) {
            console.error(error);
            alert(t('errorAdding'));
        } finally {
            setIsAdding(false);
        }
    };

    if (!isAdmin && !loading) {
        return <div className="p-4">{t('unauthorized')}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t('users')}</h1>

            <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{t('addUser')}</h3>
                <form onSubmit={addUser} className="flex gap-4 items-end">
                    <div className="w-full sm:max-w-xs">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                        />
                    </div>
                    <div className="w-full sm:max-w-xs">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            {t('name')}
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isAdding ? t('adding') : t('add')}
                    </button>
                </form>
            </div>

            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('name')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('email')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('admin')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('created')}
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">{t('actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {user.isAdmin ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    {user.isAdmin ? t('removeAdmin') : t('makeAdmin')}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    {t('delete')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

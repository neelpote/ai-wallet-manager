'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'

interface ContactsManagerProps {
  publicKey: string
}

export default function ContactsManager({ publicKey }: ContactsManagerProps) {
  const { state, addContact, removeContact } = useAppContext()
  const { contacts } = state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const handleAddContact = () => {
    if (!newName.trim() || !newAddress.trim()) return
    
    if (!newAddress.startsWith('G') || newAddress.length !== 56) {
      alert('Invalid Stellar address format')
      return
    }

    addContact({
      name: newName.trim(),
      address: newAddress.trim(),
      isTrusted: false
    })
    
    setNewName('')
    setNewAddress('')
    setShowAddForm(false)
  }

  const handleDeleteContact = (name: string) => {
    removeContact(name)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    alert('Address copied to clipboard!')
  }

  if (!publicKey) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Contacts</h2>
        <p className="text-gray-500">Connect your wallet to manage contacts</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          {showAddForm ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact name (e.g., Alice)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Stellar address (GXXX...)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddContact}
              disabled={!newName.trim() || !newAddress.trim()}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Save Contact
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No contacts saved yet. Try: "Save GXXX as Alice" in the chat
          </p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.name}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <p className="font-medium capitalize">{contact.name}</p>
                <p className="text-sm text-gray-500 font-mono">
                  {contact.address.slice(0, 8)}...{contact.address.slice(-8)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyAddress(contact.address)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
                <button
                  onClick={() => handleDeleteContact(contact.name)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {contacts.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 You can now send XLM using names: "Send 10 XLM to {contacts[0]?.name}"
          </p>
        </div>
      )}
    </div>
  )
}
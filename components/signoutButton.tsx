import React, { useState } from 'react'
import { AppState, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'

export default function Signout() {

const [loading, setLoading] = useState(false)


AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

async function logoutUser() {
  setLoading(true);
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout failed:', error.message);
  } else {
    console.log('Logout successful');
    setLoading(false);
  }
}
return(
  <View>
          <Button title="Sign out" disabled={loading} onPress={() => logoutUser()} />
  </View>
)
}
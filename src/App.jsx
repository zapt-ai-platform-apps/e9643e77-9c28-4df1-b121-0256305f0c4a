import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { createEvent, supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function App() {
  const [names, setNames] = createSignal([]);
  const [currentName, setCurrentName] = createSignal('');
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [loading, setLoading] = createSignal(false);

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(checkUserSignedIn);

  createEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const fetchNames = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/getNames', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setNames(data);
    } else {
      console.error('Error fetching names:', response.statusText);
    }
  };

  const saveName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveName', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: currentName() }),
      });
      if (response.ok) {
        setNames([...names(), { name: currentName() }]);
        setCurrentName('');
      } else {
        console.error('Error saving name');
      }
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  createEffect(() => {
    if (!user()) return;
    fetchNames();
  });

  const handleGenerateName = async () => {
    setLoading(true);
    try {
      const result = await createEvent('chatgpt_request', {
        prompt: 'Suggest a unique and meaningful baby name',
        response_type: 'text'
      });
      setCurrentName(result.trim());
    } catch (error) {
      console.error('Error generating name:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="h-full bg-gradient-to-br from-blue-100 to-green-100 p-4">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-blue-600">Sign in with ZAPT</h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                Learn more about ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
                showLinks={false}
                authView="magic_link"
              />
            </div>
          </div>
        }
      >
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-blue-600">Name My Child</h1>
            <button
              class="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>

          <div class="space-y-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-bold mb-4 text-blue-600">Generate a Name</h2>
              <div class="flex items-center space-x-4">
                <button
                  class={`cursor-pointer px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleGenerateName}
                  disabled={loading()}
                >
                  <Show when={loading()}>Generating...</Show>
                  <Show when={!loading()}>Generate Name</Show>
                </button>
                <Show when={currentName()}>
                  <div class="flex-1 text-xl text-blue-700 font-semibold">
                    {currentName()}
                  </div>
                </Show>
              </div>
              <Show when={currentName()}>
                <button
                  class="mt-4 cursor-pointer px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105"
                  onClick={saveName}
                >
                  Save Name
                </button>
              </Show>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-bold mb-4 text-blue-600">My Names</h2>
              <Show when={names().length > 0} fallback={<p>You have not saved any names yet.</p>}>
                <ul class="space-y-2">
                  <For each={names()}>
                    {(item) => (
                      <li class="text-lg text-gray-800">{item.name}</li>
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default App;
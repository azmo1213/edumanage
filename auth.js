(function (window) {
    const USERS_KEY = 'edu-users';
    const SESSION_KEY = 'edu-session';
    const SEEDED_KEY = 'edu-auth-seeded';

    const getDelay = () => Math.floor(Math.random() * 200) + 200;
    const fakeNetwork = (result) => new Promise((resolve) => {
        setTimeout(() => resolve(result), getDelay());
    });

    const getUsers = () => {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (error) {
            return [];
        }
    };

    const setUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    const seedUsers = () => {
        if (localStorage.getItem(SEEDED_KEY)) return;
        const users = [
            { id: 'u1', username: 'talaba1', role: 'talaba', fullName: 'Alisher Nazarov', group: 'MT-22' },
            { id: 'u2', username: 'talaba2', role: 'talaba', fullName: 'Malika Yusupova', group: 'MT-22' },
            { id: 'u3', username: 'teacher1', role: 'oquvchi', fullName: 'Sardor Toshmatov', subject: 'Veb dasturlash' },
            { id: 'u4', username: 'teacher2', role: 'oquvchi', fullName: 'Nilufar Karimova', subject: 'Matematika' },
            { id: 'u5', username: 'admin', role: 'admin', fullName: 'Botir Rahimov', faculty: 'Axborot texnologiyalari' }
        ];
        setUsers(users);
        localStorage.setItem(SEEDED_KEY, 'true');
    };

    const getSession = () => {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    };

    const Auth = {
        login: async function(email, password) {
          try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPass  = password.trim();

            console.log('[Auth] login attempt:', cleanEmail);

            const result = await firebase.auth()
              .signInWithEmailAndPassword(cleanEmail, cleanPass);

            const doc = await firebase.firestore()
              .collection('users')
              .doc(result.user.uid)
              .get();

            if (!doc.exists) {
              await firebase.auth().signOut();
              return { success: false, error: "Foydalanuvchi topilmadi" };
            }

            const userData = { uid: result.user.uid, ...doc.data() };
            sessionStorage.setItem('edu-session', JSON.stringify(userData));
            console.log('[Auth] login success, role:', userData.role);
            return { success: true, user: userData };

          } catch(e) {
            console.error('[Auth] login error:', e.code, e.message);
            const errors = {
              'auth/invalid-email':      "Email formati noto'g'ri",
              'auth/user-not-found':     "Bu email ro'yxatdan o'tmagan",
              'auth/wrong-password':     "Parol noto'g'ri",
              'auth/invalid-credential': "Email yoki parol noto'g'ri",
              'auth/too-many-requests':  "Juda ko'p urinish. Keyinroq urinib ko'ring",
            };
            return {
              success: false,
              error: errors[e.code] || "Xatolik: " + e.message
            };
          }
        },

        resetPassword: async function(email) {
            try {
                const cleanEmail = email.trim().toLowerCase();
                await firebase.auth().sendPasswordResetEmail(cleanEmail);
                return { success: true };
            } catch (e) {
                console.error('[Auth] resetPassword error:', e.code, e.message);
                const errors = {
                    'auth/user-not-found': "Bu email ro'yxatdan o'tmagan",
                    'auth/invalid-email': "Email formati noto'g'ri",
                };
                return {
                    success: false,
                    error: errors[e.code] || e.message || "Parolni tiklashda xatolik yuz berdi"
                };
            }
        },

        logout: () => {
            if (window.firebase && firebase.auth) {
                firebase.auth().signOut().finally(() => {
                    sessionStorage.clear();
                    window.location.reload();
                });
            } else {
                sessionStorage.clear();
                window.location.reload();
            }
        },

        getSession: () => getSession(),

        isLoggedIn: () => !!getSession(),

        getRole: () => {
            const session = getSession();
            return session ? session.role : null;
        },

        getAllUsers: () => getUsers(),

        addUser: (userObj) => {
            const users = getUsers();
            const newUser = Object.assign({}, userObj, { id: `u${Date.now()}` });
            users.push(newUser);
            setUsers(users);
            return users;
        },

        deleteUser: (id) => {
            const users = getUsers();
            const updated = users.filter((user) => user.id !== id);
            setUsers(updated);
            return updated;
        },

        createUserWithEmail: async function(email, fullName, role, extra) {
            try {
                const tempPassword = 'TempPass@' + Math.random().toString(36).slice(2, 8);
                const result = await firebase.auth().createUserWithEmailAndPassword(email, tempPassword);
                await firebase.firestore().collection('users').doc(result.user.uid).set({
                    fullName, email, role, ...extra,
                    createdAt: new Date().toISOString()
                });
                await firebase.auth().sendPasswordResetEmail(email);
                return { success: true, uid: result.user.uid, email };
            } catch(e) {
                return { success: false, email, error: e.message };
            }
        },

        bulkCreate: async function(users, onProgress) {
            const adminSession = Auth.getSession();
            const results = { success: [], failed: [] };

            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                onProgress(`${user.email} yaratilmoqda...`, Math.round(((i+1)/users.length)*90));

                const result = await Auth.createUserWithEmail(
                    user.email, user.fullName, user.role,
                    { group: user.group || '', subject: user.subject || '' }
                );

                if (result.success) results.success.push(result);
                else results.failed.push(result);

                await new Promise(r => setTimeout(r, 1500)); // avoid rate limiting
            }

            // Restore admin session after bulk create
            sessionStorage.setItem('edu-session', JSON.stringify(adminSession));
            onProgress('Tayyor! ✅', 100);
            return results;
        },

        onAuthReady: function(callback) {
            console.log('[Auth] onAuthReady called');

            function waitForFirebase(retries) {
                if (typeof firebase === 'undefined' || !firebase.auth) {
                    if (retries <= 0) {
                        console.error('[Auth] Firebase failed to load after retries');
                        callback(null);
                        return;
                    }
                    console.log('[Auth] Waiting for Firebase... retries left:', retries);
                    setTimeout(() => waitForFirebase(retries - 1), 300);
                    return;
                }

                console.log('[Auth] Firebase ready, setting up listener');
                const unsubscribe = firebase.auth().onAuthStateChanged(async (firebaseUser) => {
                    unsubscribe();
                    if (firebaseUser) {
                        try {
                            const doc = await firebase.firestore()
                                .collection('users')
                                .doc(firebaseUser.uid)
                                .get();
                            if (doc.exists) {
                                const userData = { uid: firebaseUser.uid, ...doc.data() };
                                sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
                                console.log('[Auth] session ready, role:', userData.role);
                                callback(userData);
                            } else {
                                console.log('[Auth] user doc not found in Firestore');
                                callback(null);
                            }
                        } catch (e) {
                            console.error('[Auth] Firestore error:', e);
                            callback(null);
                        }
                    } else {
                        sessionStorage.removeItem(SESSION_KEY);
                        console.log('[Auth] no user — showing login');
                        callback(null);
                    }
                });
            }

            waitForFirebase(10);
        }
    };

    const setHeaderUserName = () => {
        const session = getSession();
        if (!session) return;
        const userNameEl = document.querySelector('.user-name');
        const greetingEl = document.querySelector('.greeting');
        const logoutButton = document.getElementById('logout-button');

        if (userNameEl) userNameEl.textContent = session.fullName;
        if (greetingEl) greetingEl.textContent = `Xush kelibsiz, ${session.fullName.split(' ')[0]}`;
        if (logoutButton) logoutButton.style.display = 'inline-flex';
    };

    const showLoginScreen = () => {
        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.querySelector('.app-container');
        if (authScreen) authScreen.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
    };

    const showApp = () => {
        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.querySelector('.app-container');
        if (authScreen) authScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
    };

    const activateRoleButtons = () => {
        const buttons = document.querySelectorAll('[data-role-button]');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                buttons.forEach((btn) => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    };

    const initAuthUI = () => {
        const loginButton = document.getElementById('login-button');
        const usernameInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const errorEl = document.getElementById('login-error');

        if (!loginButton || !usernameInput || !passwordInput || !errorEl) return;

        activateRoleButtons();

        if (Auth.isLoggedIn()) {
            showApp();
            setHeaderUserName();
            return;
        }

        showLoginScreen();

        const forgotBtn = document.getElementById('forgot-btn');
        const forgotForm = document.getElementById('forgot-form');
        const resetEmailInput = document.getElementById('reset-email');
        const sendResetBtn = document.getElementById('send-reset-btn');
        const resetMsg = document.getElementById('reset-msg');

        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();
            errorEl.style.display = 'none';
            const email = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                errorEl.textContent = "Email va parolni kiriting";
                errorEl.style.display = 'block';
                return;
            }

            const result = await Auth.login(email, password);
            if (result.success) {
                showApp();
                setHeaderUserName();
                if (typeof window.initApp === 'function') {
                    window.initApp();
                }
                return;
            }
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        });

        if (forgotBtn && forgotForm && resetEmailInput && sendResetBtn && resetMsg) {
            forgotBtn.addEventListener('click', () => {
                forgotForm.style.display = forgotForm.style.display === 'flex' ? 'none' : 'flex';
                resetMsg.textContent = '';
            });

            sendResetBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                resetMsg.textContent = '';
                const email = resetEmailInput.value.trim();
                if (!email) {
                    resetMsg.textContent = "Iltimos, email manzilingizni kiriting.";
                    resetMsg.style.color = '#dc2626';
                    return;
                }
                const result = await Auth.resetPassword(email);
                resetMsg.textContent = result.success
                    ? "Email yuborildi! Pochta qutingizni tekshiring"
                    : result.error;
                resetMsg.style.color = result.success ? '#16a34a' : '#dc2626';
            });
        }
    };

    seedUsers();
    window.Auth = Auth;
    window.showLoginScreen = showLoginScreen;
    window.hideLoginScreen = showApp;

    document.addEventListener('DOMContentLoaded', initAuthUI);
})(window);

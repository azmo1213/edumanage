const initApp = () => {
    const oldNav = document.querySelector('.bottom-nav');
    if (oldNav) {
        const newNav = oldNav.cloneNode(true);
        oldNav.parentNode.replaceChild(newNav, oldNav);
    }

    const savedTheme = localStorage.getItem('edumanage-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }

    const savedPage = sessionStorage.getItem('edumanage-page') || 'dashboard';
    let notificationDropdown = null;

    const showToast = (msg) => {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    };

    const role = window.Auth ? window.Auth.getRole() : null;
    const isTeacher = role === 'oquvchi';
    const isAdmin = role === 'admin';

    const nav = document.querySelector('.bottom-nav');
    const buildTeacherNav = () => {
        nav.innerHTML = `
            <button class="nav-item active" data-target="teacher-dashboard">
                <div class="nav-icon"><i class="ph ph-squares-four"></i></div>
                <span>Bosh sahifa</span>
            </button>
            <button class="nav-item" data-target="attendance">
                <div class="nav-icon"><i class="ph ph-check-circle"></i></div>
                <span>Davomat</span>
            </button>
            <button class="nav-item" data-target="grading">
                <div class="nav-icon"><i class="ph ph-star"></i></div>
                <span>Baholar</span>
            </button>
            <button class="nav-item" data-target="profile">
                <div class="nav-icon"><i class="ph ph-user-circle"></i></div>
                <span>Profil</span>
            </button>
        `;
    };

    const buildAdminNav = () => {
        nav.innerHTML = `
            <button class="nav-item active" data-target="admin-dashboard">
                <div class="nav-icon"><i class="ph ph-squares-four"></i></div>
                <span>Statistika</span>
            </button>
            <button class="nav-item" data-target="users">
                <div class="nav-icon"><i class="ph ph-users"></i></div>
                <span>Foydalanuvchilar</span>
            </button>
            <button class="nav-item" data-target="courses-admin">
                <div class="nav-icon"><i class="ph ph-book-open"></i></div>
                <span>Fanlar</span>
            </button>
            <button class="nav-item" data-target="profile">
                <div class="nav-icon"><i class="ph ph-user-circle"></i></div>
                <span>Profil</span>
            </button>
        `;
    };

    const buildStudentNav = () => {
        nav.innerHTML = `
            <button class="nav-item active" data-target="dashboard">
                <div class="nav-icon"><i class="ph ph-squares-four"></i></div>
                <span>Bosh sahifa</span>
            </button>
            <button class="nav-item" data-target="courses">
                <div class="nav-icon"><i class="ph ph-book-open"></i></div>
                <span>Fanlar</span>
            </button>
            <button class="nav-item" data-target="schedule">
                <div class="nav-icon"><i class="ph ph-calendar-blank"></i></div>
                <span>Dars jadvali</span>
            </button>
            <button class="nav-item" data-target="grades">
                <div class="nav-icon"><i class="ph ph-check-square"></i></div>
                <span>Baholar</span>
            </button>
            <button class="nav-item" data-target="profile">
                <div class="nav-icon"><i class="ph ph-user"></i></div>
                <span>Profil</span>
            </button>
        `;
    };

    if (isTeacher) {
        buildTeacherNav();
    } else if (isAdmin) {
        buildAdminNav();
    } else {
        buildStudentNav();
    }

    const initialPage = isTeacher && savedPage === 'dashboard'
        ? 'teacher-dashboard'
        : (isAdmin ? 'admin-dashboard' : savedPage);

    const dayShortMap = {
        0: 'Ya',
        1: 'Du',
        2: 'Se',
        3: 'Ch',
        4: 'Pa',
        5: 'Ju',
        6: 'Sh'
    };

    const getTodayShort = () => dayShortMap[new Date().getDay()] || 'Du';

    const loadSection = async (containerId, fetchFn, renderFn) => {
        const el = document.querySelector(containerId);
        if (!el) return;

        el.innerHTML = '<div class="loader"></div>';

        try {
            const data = await fetchFn();
            el.innerHTML = '';
            renderFn(data, el);
            el.classList.add('fade-in');
        } catch (error) {
            el.innerHTML = '<p class="error-msg">Xatolik yuz berdi</p>';
        }
    };

    const formatDate = (isoDate) => {
        const parts = isoDate.split('-');
        return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : isoDate;
    };

    const updateNotificationCount = (count) => {
        const badge = document.querySelector('.badge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    };

    const setActiveNav = (target) => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-target') === target);
        });
    };

    const bindProfileListeners = () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        if (document.body.classList.contains('dark')) {
            themeToggle.classList.add('active');
        }

        themeToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            themeToggle.classList.toggle('active');
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('edumanage-theme', isDark ? 'dark' : 'light');
        });
    };

    const bindCourseSearch = () => {
        const searchInput = document.getElementById('course-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const courseCards = document.querySelectorAll('.course-card');
            courseCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                card.style.display = title.includes(query) ? '' : 'none';
            });
        });
    };

    const renderDashboardStudent = (student, el) => {
        const nameParts = student.fullName.split(' ');
        const firstName = nameParts[0] || student.fullName;

        const userName = document.querySelector('.user-name');
        const greeting = document.querySelector('.greeting');
        if (userName) userName.textContent = student.fullName;
        if (greeting) greeting.textContent = `Xush kelibsiz, ${firstName}`;

        const progressPercent = student.gpa ? Math.min(100, Math.round((student.gpa / 4.0) * 100)) : 0;

        el.innerHTML = `
            <div class="card gradient-card">
                <div class="card-top">
                    <h3>${student.fullName}</h3>
                    <i class="ph-fill ph-chart-line-up"></i>
                </div>
                <div class="card-score">${student.gpa.toFixed(2)}</div>
                <div class="progress-bar-container mt-2">
                    <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                </div>
                <p class="card-subtitle mt-2">${student.faculty} · ${student.group}</p>
                <div class="dashboard-meta mt-3">
                    <p>Semester: ${student.semester} · Kreditalar: ${student.completedCredits}/${student.totalCredits}</p>
                </div>
            </div>
        `;
    };

    const renderDashboardStats = (stats, el) => {
        el.innerHTML = `
            <div class="task-card">
                <div class="task-info">
                    <h4>Davomat</h4>
                    <p>${stats.attendancePercent}%</p>
                </div>
            </div>
            <div class="task-card">
                <div class="task-info">
                    <h4>Topshiriqlar</h4>
                    <p>${stats.completedTasks} ta bajarildi</p>
                </div>
            </div>
            <div class="task-card">
                <div class="task-info">
                    <h4>Kutilayotgan baholar</h4>
                    <p>${stats.pendingGrades} ta</p>
                </div>
            </div>
        `;
        updateNotificationCount(stats.unreadCount);
    };

    const renderDashboardSchedule = (items, el) => {
        if (!items || !items.length) {
            el.innerHTML = '<p class="error-msg">Bugun darslar mavjud emas</p>';
            return;
        }

        el.innerHTML = items.map((item) => `
            <div class="timeline-item ${item.type === 'Ma\'ruza' ? 'active' : ''}">
                <div class="time">${item.startTime}</div>
                <div class="timeline-content">
                    <h4>${item.subject}</h4>
                    <p>${item.room} xona • ${item.type}</p>
                </div>
            </div>
        `).join('');
    };

    const renderDashboardTasks = (tasks, el) => {
        if (!tasks || !tasks.length) {
            el.innerHTML = '<p class="error-msg">Hozircha topshiriq yo\'q</p>';
            return;
        }

        el.innerHTML = tasks.map((task) => `
            <label class="task-card">
                <input type="checkbox" data-task-id="${task.id}" ${task.isDone ? 'checked' : ''}>
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <p>${task.courseName} • ${formatDate(task.dueDate)}</p>
                </div>
            </label>
        `).join('');

        el.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener('change', async () => {
                const taskId = checkbox.getAttribute('data-task-id');
                try {
                    await MockDB.toggleTask(taskId);
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                }
                loadSection('#dashboard-tasks', async () => {
                    try {
                        return await MockDB.getTasks();
                    } catch(e) {
                        if (e.code === 'permission-denied') {
                            console.warn('Permission denied — check Firestore Rules');
                        }
                        return [];
                    }
                }, renderDashboardTasks);
                loadSection('#dashboard-stats', async () => {
                    try {
                        return await MockDB.getStats();
                    } catch(e) {
                        if (e.code === 'permission-denied') {
                            console.warn('Permission denied — check Firestore Rules');
                        }
                        return {};
                    }
                }, renderDashboardStats);
            });
        });
    };

    const renderCourseCards = (courses, el) => {
        if (!courses || !courses.length) {
            el.innerHTML = '<p class="error-msg">Fanlar topilmadi</p>';
            return;
        }

        el.innerHTML = courses.map((course) => `
            <div class="course-card ${course.color}">
                <div class="course-img ${course.color}"><i class="ph ph-book-open"></i></div>
                <div class="course-details">
                    <h3>${course.name}</h3>
                    <p>${course.teacherName} • ${course.creditHours} kredit</p>
                    <div class="course-progress mt-2">
                        <div class="progress-bar-container sm">
                            <div class="progress-bar" style="width: ${course.progress}%;"></div>
                        </div>
                        <span>${course.currentGrade}</span>
                    </div>
                </div>
            </div>
        `).join('');

        bindCourseSearch();
    };

    const renderScheduleContent = (items, el) => {
        if (!items || !items.length) {
            el.innerHTML = '<p class="error-msg">Tanlangan kunda darslar yo\'q</p>';
            return;
        }

        el.innerHTML = items.map((item) => `
            <div class="schedule-card">
                <div class="time-col">
                    <span class="time-start">${item.startTime}</span>
                    <span class="time-end">${item.endTime}</span>
                </div>
                <div class="info-col">
                    <h4>${item.subject}</h4>
                    <p>O'qituvchi: ${item.teacherName}</p>
                    <div class="tags mt-2">
                        <span class="tag ${item.type === 'Ma\'ruza' ? 'bg-blue-light' : 'bg-purple-light'}">${item.type}</span>
                        <span class="tag"><i class="ph ph-map-pin"></i> ${item.room}-xona</span>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const renderGrades = (grades, el) => {
        if (!grades || !grades.length) {
            el.innerHTML = '<p class="error-msg">Baholar mavjud emas</p>';
            return;
        }

        el.innerHTML = grades.map((grade) => `
            <div class="task-card">
                <div class="task-info">
                    <h4>${grade.courseName}</h4>
                    <p>${grade.type} • ${formatDate(grade.date)}</p>
                </div>
                <div>
                    <div class="tag ${grade.status === 'baholandi' ? 'bg-blue-light' : 'bg-orange-light'}">${grade.status}</div>
                    <p>${grade.score}/${grade.maxScore}</p>
                </div>
            </div>
        `).join('');
    };

    const renderGradesPage = () => {
        loadSection('#grades-content', async () => {
            try {
                return await MockDB.getGrades({});
            } catch(e) {
                if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                }
                return [];
            }
        }, renderGrades);
    };

    const renderProfile = async () => {
        const session = window.Auth.getSession();
        if (!session) return;

        const profileNameEl = document.querySelector('.profile-name');
        const profileRoleEl = document.querySelector('.profile-role');
        const profileAvatarEl = document.querySelector('.profile-avatar img');
        const profileBadgesEl = document.querySelector('.profile-badges');
        const logoutItem = document.querySelector('.setting-item.text-red');

        if (profileNameEl) {
            profileNameEl.textContent = session.fullName || '';
        }

        const profileId = session.id || session.uid || '';
        if (profileRoleEl) {
            profileRoleEl.textContent = session.role === 'talaba'
                ? `Talaba ID: ${profileId}`
                : session.role === 'oquvchi'
                    ? `O'qituvchi ID: ${profileId}`
                    : `ID: ${profileId}`;
        }

        if (profileAvatarEl) {
            const avatarName = encodeURIComponent(session.fullName || 'User');
            profileAvatarEl.src = `https://ui-avatars.com/api/?name=${avatarName}&background=6366f1&color=fff&size=120`;
        }

        if (profileBadgesEl) {
            if (session.role === 'talaba') {
                let student = null;
                try {
                    student = await MockDB.getStudent();
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                }
                profileBadgesEl.innerHTML = `
                    <span class="badge-item"><i class="ph ph-medal"></i> GPA: ${student?.gpa?.toFixed(2) ?? 'N/A'}</span>
                    <span class="badge-item"><i class="ph ph-star"></i> Semester: ${student?.semester ?? 'N/A'}</span>
                `;
                profileBadgesEl.style.display = '';
            } else if (session.role === 'oquvchi') {
                const parts = [];
                if (session.subject) {
                    parts.push(`<span class="badge-item"><i class="ph ph-chalkboard"></i> ${session.subject}</span>`);
                }
                if (session.faculty) {
                    parts.push(`<span class="badge-item"><i class="ph ph-building"></i> ${session.faculty}</span>`);
                }
                profileBadgesEl.innerHTML = parts.join('');
                profileBadgesEl.style.display = parts.length ? '' : 'none';
            } else {
                profileBadgesEl.style.display = 'none';
            }
        }

        if (logoutItem) {
            logoutItem.onclick = () => {
                if (window.Auth && typeof window.Auth.logout === 'function') {
                    window.Auth.logout();
                }
            };
        }
    };

    const renderTeacherDashboard = async () => {
        const session = window.Auth.getSession();
        const todayShort = getTodayShort();
        let stats = {}, schedule = [], groups = [];
        try {
            [stats, schedule, groups] = await Promise.all([
                MockDB.getStats(),
                MockDB.getSchedule({ day: todayShort }),
                MockDB.getGroups()
            ]);
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        const totalStudents = groups.reduce((sum, g) => sum + g.students.length, 0);
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page teacher-dashboard-page fade-in">
                <h1>Salom, ${session.fullName}!</h1>
                <div class="stats-cards" style="display:flex;gap:16px;margin:20px 0;">
                    <div class="stat-card" style="flex:1;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${schedule.length}</h3>
                        <p>Bugungi darslar soni</p>
                    </div>
                    <div class="stat-card" style="flex:1;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${totalStudents}</h3>
                        <p>Jami talabalar</p>
                    </div>
                    <div class="stat-card" style="flex:1;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${stats.pendingGrades}</h3>
                        <p>Baholanmagan ishlar</p>
                    </div>
                </div>
                <section class="section-container mt-4">
                    <div class="section-header">
                        <h2>Bugungi darslar</h2>
                    </div>
                    <div class="timeline mt-3" id="teacher-today-schedule">
                        ${schedule.map(item => `
                            <div class="timeline-item">
                                <div class="time">${item.startTime}</div>
                                <div class="timeline-content">
                                    <h4>${item.subject}</h4>
                                    <p>${item.room} xona • ${item.type}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;
    };

    const renderAttendancePage = async () => {
        let groups = [];
        try {
            groups = await MockDB.getGroups();
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        const today = new Date().toISOString().split('T')[0];
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page attendance-page fade-in">
                <h1>Davomat belgilash</h1>
                <div style="margin:20px 0;">
                    <select id="group-select" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="">Guruhni tanlang</option>
                        ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                    </select>
                    <input type="date" id="date-select" value="${today}" style="margin-left:16px;padding:8px;border:1px solid var(--border-color);border-radius:8px;">
                    <button id="load-attendance" style="margin-left:16px;padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Yuklash</button>
                </div>
                <div id="attendance-list"></div>
                <button id="save-attendance" style="margin-top:20px;padding:12px 24px;background:var(--primary);color:#fff;border:none;border-radius:8px;display:none;">Saqlash</button>
            </div>
        `;

        const loadAttendance = async () => {
            const groupId = document.getElementById('group-select').value;
            const date = document.getElementById('date-select').value;
            if (!groupId || !date) return;
            let students = [], attendance = [];
            try {
                [students, attendance] = await Promise.all([
                    MockDB.getStudentsByGroup(groupId),
                    MockDB.getAttendance({ groupId, date })
                ]);
            } catch(e) {
                if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                }
            }
            const attendanceMap = {};
            attendance.forEach(a => attendanceMap[a.studentId] = a.status);
            const listEl = document.getElementById('attendance-list');
            listEl.innerHTML = students.map(student => `
                <div class="attendance-row" style="display:flex;align-items:center;padding:12px;border-bottom:1px solid var(--border-color);">
                    <span style="flex:1;">${student.fullName}</span>
                    <div class="status-buttons" style="display:flex;gap:8px;">
                        <button class="status-btn active" data-student="${student.id}" data-status="keldi">Keldi</button>
                        <button class="status-btn" data-student="${student.id}" data-status="kech">Kech</button>
                        <button class="status-btn" data-student="${student.id}" data-status="kelmadi">Kelmadi</button>
                    </div>
                </div>
            `).join('');
            document.getElementById('save-attendance').style.display = 'block';
        };

        document.getElementById('load-attendance').addEventListener('click', loadAttendance);
        document.getElementById('save-attendance').addEventListener('click', async () => {
            const records = [];
            document.querySelectorAll('.attendance-row').forEach(row => {
                const studentId = row.querySelector('.status-btn.active')?.getAttribute('data-student');
                const status = row.querySelector('.status-btn.active')?.getAttribute('data-status');
                if (studentId && status) {
                    records.push({
                        studentId,
                        date: document.getElementById('date-select').value,
                        groupId: document.getElementById('group-select').value,
                        status
                    });
                }
            });
            try {
                await MockDB.saveAttendance(records);
                showToast("Davomat saqlandi ✅");
            } catch(e) {
                if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                }
                showToast('Xatolik yuz berdi');
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-btn')) {
                const row = e.target.closest('.attendance-row');
                row.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    };

    const renderGradingPage = async () => {
        let groups = [], courses = [], grades = [];
        try {
            [groups, courses, grades] = await Promise.all([
                MockDB.getGroups(),
                MockDB.getCourses(),
                MockDB.getGrades({})
            ]);
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        const recentGrades = grades.slice(0, 10);
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page grading-page fade-in">
                <h1>Baho qo'yish</h1>
                <div style="margin:20px 0;display:flex;gap:16px;flex-wrap:wrap;">
                    <select id="grade-group-select" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="">Guruh</option>
                        ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                    </select>
                    <select id="grade-student-select" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;" disabled>
                        <option value="">Talaba</option>
                    </select>
                    <select id="grade-course-select" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="">Fan</option>
                        ${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <select id="grade-type-select" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="">Turi</option>
                        <option value="Mustaqil ish">Mustaqil ish</option>
                        <option value="Nazorat ishi">Nazorat ishi</option>
                        <option value="Laboratoriya">Laboratoriya</option>
                    </select>
                    <input type="number" id="grade-score" placeholder="Baholar" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;width:100px;">
                    <input type="number" id="grade-max" placeholder="Max" value="100" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;width:80px;">
                    <button id="save-grade" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Baho qo'yish</button>
                </div>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-surface);">
                            <th style="padding:8px;border:1px solid var(--border-color);">Talaba</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Fan</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Turi</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Baho</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Sana</th>
                        </tr>
                    </thead>
                    <tbody id="grades-table">
                        ${recentGrades.map(g => `
                            <tr>
                                <td style="padding:8px;border:1px solid var(--border-color);">${g.studentId || 'N/A'}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${g.courseName}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${g.type}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${g.score}/${g.maxScore}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${g.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const groupSelect = document.getElementById('grade-group-select');
        const studentSelect = document.getElementById('grade-student-select');
        groupSelect.addEventListener('change', async () => {
            const groupId = groupSelect.value;
            if (groupId) {
                let students = [];
                try {
                    students = await MockDB.getStudentsByGroup(groupId);
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                }
                studentSelect.innerHTML = '<option value="">Talaba</option>' + students.map(s => `<option value="${s.id}">${s.fullName}</option>`).join('');
                studentSelect.disabled = false;
            } else {
                studentSelect.innerHTML = '<option value="">Talaba</option>';
                studentSelect.disabled = true;
            }
        });

        document.getElementById('save-grade').addEventListener('click', async () => {
            const studentId = studentSelect.value;
            const courseId = document.getElementById('grade-course-select').value;
            const type = document.getElementById('grade-type-select').value;
            const score = parseInt(document.getElementById('grade-score').value);
            const maxScore = parseInt(document.getElementById('grade-max').value);
            if (!studentId || !courseId || !type || isNaN(score)) return;
            try {
                await MockDB.saveGrade({ studentId, courseId, type, score, maxScore });
                showToast("Baho saqlandi ✅");
            } catch(e) {
                if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                }
                showToast('Xatolik yuz berdi');
            }
            renderGradingPage(); // reload
        });
    };

    const renderAssignmentsPage = async () => {
        let tasks = [], courses = [];
        try {
            tasks = await MockDB.getTasks();
            courses = await MockDB.getCourses();
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page assignments-page fade-in">
                <h1>Topshiriqlar</h1>
                <div style="margin:20px 0;padding:16px;background:var(--bg-surface);border-radius:12px;">
                    <h3>Yangi topshiriq</h3>
                    <input type="text" id="task-title" placeholder="Sarlavha" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <select id="task-course" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="">Fan</option>
                        ${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <input type="date" id="task-due" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <textarea id="task-desc" placeholder="Tavsif" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;min-height:80px;"></textarea>
                    <button id="add-task" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Qo'shish</button>
                </div>
                <div id="tasks-list">
                    ${tasks.map(task => `
                        <div class="task-card">
                            <div class="task-info">
                                <h4>${task.title}</h4>
                                <p>${task.courseName} • ${task.dueDate}</p>
                                ${task.assignedBy ? `<small>Berilgan: ${task.assignedBy}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('add-task').addEventListener('click', async () => {
            const title = document.getElementById('task-title').value.trim();
            const courseId = document.getElementById('task-course').value;
            const dueDate = document.getElementById('task-due').value;
            const description = document.getElementById('task-desc').value.trim();
            const course = courses.find(c => c.id === courseId);
            if (!title || !courseId || !dueDate) return;
            const session = window.Auth.getSession();
            try {
                await MockDB.addTask({
                    title,
                    courseId,
                    courseName: course.name,
                    dueDate,
                    isDone: false,
                    priority: "o'rta",
                    assignedBy: session.fullName
                });
                renderAssignmentsPage(); // reload
            } catch(e) {
                if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                }
                showToast('Xatolik yuz berdi');
            }
        });
    };

    const renderAdminDashboard = async () => {
        const session = window.Auth.getSession();
        const users = window.Auth.getAllUsers();
        let courses = [];
        try {
            courses = await MockDB.getCourses();
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        const students = users.filter(u => u.role === 'talaba').length;
        const teachers = users.filter(u => u.role === 'oquvchi').length;
        const admins = users.filter(u => u.role === 'admin').length;
        const totalUsers = users.length;
        const totalCourses = courses.length;
        const maxCount = Math.max(students, teachers, admins);
        const scale = maxCount > 0 ? 120 / maxCount : 0;
        const studentHeight = students * scale;
        const teacherHeight = teachers * scale;
        const adminHeight = admins * scale;
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page admin-dashboard-page fade-in">
                <h1>Boshqaruv paneli</h1>
                <div class="stats-cards" style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
                    <div class="stat-card" style="flex:1;min-width:150px;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${totalUsers}</h3>
                        <p>Jami foydalanuvchilar</p>
                    </div>
                    <div class="stat-card" style="flex:1;min-width:150px;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${students}</h3>
                        <p>Talabalar soni</p>
                    </div>
                    <div class="stat-card" style="flex:1;min-width:150px;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${teachers}</h3>
                        <p>O'qituvchilar soni</p>
                    </div>
                    <div class="stat-card" style="flex:1;min-width:150px;padding:16px;background:var(--bg-surface);border-radius:12px;text-align:center;">
                        <h3>${totalCourses}</h3>
                        <p>Jami fanlar</p>
                    </div>
                </div>
                <div style="text-align:center;margin:20px 0;">
                    <svg width="300" height="160" style="display:block;margin:0 auto;">
                        <rect x="20" y="${140 - studentHeight}" width="60" height="${studentHeight}" fill="teal"></rect>
                        <text x="50" y="155" text-anchor="middle" font-size="12" fill="var(--text-main)">Talabalar</text>
                        <text x="50" y="${135 - studentHeight}" text-anchor="middle" font-size="12" fill="var(--text-main)">${students}</text>
                        <rect x="100" y="${140 - teacherHeight}" width="60" height="${teacherHeight}" fill="amber"></rect>
                        <text x="130" y="155" text-anchor="middle" font-size="12" fill="var(--text-main)">O'qituvchilar</text>
                        <text x="130" y="${135 - teacherHeight}" text-anchor="middle" font-size="12" fill="var(--text-main)">${teachers}</text>
                        <rect x="180" y="${140 - adminHeight}" width="60" height="${adminHeight}" fill="coral"></rect>
                        <text x="210" y="155" text-anchor="middle" font-size="12" fill="var(--text-main)">Adminlar</text>
                        <text x="210" y="${135 - adminHeight}" text-anchor="middle" font-size="12" fill="var(--text-main)">${admins}</text>
                    </svg>
                </div>
            </div>
        `;
    };

    const renderUsersPage = () => {
        const session = window.Auth.getSession();
        const users = window.Auth.getAllUsers();
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page users-page fade-in">
                <h1>Foydalanuvchilar</h1>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <thead>
                        <tr style="background:var(--bg-surface);">
                            <th style="padding:8px;border:1px solid var(--border-color);">Ism</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Username</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Rol</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Guruh/Fan</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td style="padding:8px;border:1px solid var(--border-color);">${u.fullName}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${u.username}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${u.role}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${u.role === 'talaba' ? (u.group || '') : (u.subject || '')}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">
                                    <button onclick="deleteUser('${u.id}')" ${u.id === session.userId ? 'disabled' : ''}>O'chirish</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin:20px 0;padding:16px;background:var(--bg-surface);border-radius:12px;">
                    <h3>Yangi foydalanuvchi</h3>
                    <input type="text" id="new-fullname" placeholder="To'liq ism" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="text" id="new-username" placeholder="Username" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="password" id="new-password" placeholder="Parol" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <select id="new-role" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                        <option value="talaba">Talaba</option>
                        <option value="oquvchi">O'qituvchi</option>
                        <option value="admin">Admin</option>
                    </select>
                    <input type="text" id="new-group-subject" placeholder="Guruh (talaba) yoki Fan (o'qituvchi)" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <button id="add-user" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Qo'shish</button>
                </div>
                <div class="import-section">
                    <h3>Excel orqali ommaviy yuklash</h3>
                    <p class="hint-text">Excel fayl ustunlari: Ism | Email | Rol | Guruh/Fan</p>
                    <button id="download-template-btn" class="btn-secondary">📥 Namuna Excel yuklash</button>
                    <input id="excel-file-input" type="file" accept=".xlsx,.xls" hidden>
                    <button id="choose-excel-btn" class="btn-secondary">📂 Excel fayl tanlash</button>
                    <div id="excel-preview"></div>
                    <button id="start-import-btn" class="btn-success" style="display:none;">✅ Yuklashni boshlash</button>
                    <div id="import-progress" style="display:none;"></div>
                    <div id="import-results" style="display:none;"></div>
                </div>
            </div>
        `;

        document.getElementById('add-user').addEventListener('click', () => {
            const fullName = document.getElementById('new-fullname').value.trim();
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value.trim();
            const role = document.getElementById('new-role').value;
            const groupSubject = document.getElementById('new-group-subject').value.trim();
            if (!fullName || !username || !password) return;
            const userObj = { fullName, username, password, role };
            if (role === 'talaba') userObj.group = groupSubject;
            else if (role === 'oquvchi') userObj.subject = groupSubject;
            window.Auth.addUser(userObj);
            renderUsersPage();
        });

        window.deleteUser = (id) => {
            if (id === session.userId) return;
            window.Auth.deleteUser(id);
            renderUsersPage();
        };

        // Bulk import event listeners
        document.getElementById('download-template-btn').addEventListener('click', () => {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([
                ['Ism', 'Email', 'Rol', 'Guruh/Fan'],
                ['Alisher Nazarov', 'a.nazarov@gmail.com', 'talaba', 'MT-22'],
                ['Sardor Toshmatov', 's.toshmatov@gmail.com', 'oquvchi', 'Veb dasturlash'],
            ]);
            ws['!cols'] = [{wch:25},{wch:30},{wch:12},{wch:20}];
            XLSX.utils.book_append_sheet(wb, ws, 'Foydalanuvchilar');
            XLSX.writeFile(wb, 'EduManage_Namuna.xlsx');
        });

        document.getElementById('choose-excel-btn').addEventListener('click', () => {
            document.getElementById('excel-file-input').click();
        });

        document.getElementById('excel-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                const users = rows.slice(1).filter(r => r[0] && r[1]).map(r => ({
                    fullName: r[0], email: r[1], role: r[2] || 'talaba', group: r[3] || ''
                }));
                const previewEl = document.getElementById('excel-preview');
                previewEl.innerHTML = `
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>Ism</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Guruh</th>
                                <th>Holat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `<tr><td>${u.fullName}</td><td>${u.email}</td><td>${u.role}</td><td>${u.group}</td><td class="status-pending">Kutilmoqda ⏳</td></tr>`).join('')}
                        </tbody>
                    </table>
                `;
                document.getElementById('start-import-btn').style.display = 'block';
                window.bulkUsers = users;
                window.bulkRows = previewEl.querySelectorAll('tbody tr');
            };
            reader.readAsArrayBuffer(file);
        });

        document.getElementById('start-import-btn').addEventListener('click', async () => {
            const users = window.bulkUsers;
            if (!users || !users.length) return;
            const btn = document.getElementById('start-import-btn');
            const progressEl = document.getElementById('import-progress');
            const resultsEl = document.getElementById('import-results');
            btn.disabled = true;
            progressEl.style.display = 'block';
            resultsEl.style.display = 'none';

            const results = await window.Auth.bulkCreate(users, (message, percent) => {
                progressEl.innerHTML = `
                    <div class="progress-bar-wrap">
                        <div class="progress-bar" style="width:${percent}%"></div>
                    </div>
                    <p class="progress-msg">${message}</p>
                `;
            });

            resultsEl.innerHTML = `
                <p>✅ ${results.success.length} ta muvaffaqiyatli | ❌ ${results.failed.length} ta xato</p>
                <p>Barcha foydalanuvchilarga parol o'rnatish emaili yuborildi</p>
            `;
            resultsEl.style.display = 'block';
            btn.disabled = false;
            renderUsersPage(); // refresh list
        });
    };

    const renderCoursesPage = async () => {
        const courses = await MockDB.getCourses();
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page courses-admin-page fade-in">
                <h1>Fanlar</h1>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <thead>
                        <tr style="background:var(--bg-surface);">
                            <th style="padding:8px;border:1px solid var(--border-color);">Fan nomi</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">O'qituvchi</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Kredit</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Daraja</th>
                            <th style="padding:8px;border:1px solid var(--border-color);">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses.map(c => `
                            <tr>
                                <td style="padding:8px;border:1px solid var(--border-color);">${c.name}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${c.teacherName}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${c.creditHours}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">${c.currentGrade}</td>
                                <td style="padding:8px;border:1px solid var(--border-color);">
                                    <button onclick="deleteCourse('${c.id}')">O'chirish</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin:20px 0;padding:16px;background:var(--bg-surface);border-radius:12px;">
                    <h3>Yangi fan</h3>
                    <input type="text" id="new-course-name" placeholder="Fan nomi" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="text" id="new-teacher-name" placeholder="O'qituvchi" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="number" id="new-credit-hours" placeholder="Kredit" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="text" id="new-current-grade" placeholder="Daraja" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="number" id="new-progress" placeholder="Progress %" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <input type="text" id="new-color" placeholder="Rang (e.g. color-1)" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                    <button id="add-course" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Qo'shish</button>
                </div>
            </div>
        `;

        document.getElementById('add-course').addEventListener('click', async () => {
            const name = document.getElementById('new-course-name').value.trim();
            const teacherName = document.getElementById('new-teacher-name').value.trim();
            const creditHours = parseInt(document.getElementById('new-credit-hours').value);
            const currentGrade = document.getElementById('new-current-grade').value.trim();
            const progress = parseInt(document.getElementById('new-progress').value);
            const color = document.getElementById('new-color').value.trim();
            if (!name || !teacherName || isNaN(creditHours)) return;
            await MockDB.addCourse({ name, teacherName, creditHours, currentGrade, progress, color });
            renderCoursesPage();
        });

        window.deleteCourse = async (id) => {
            await MockDB.deleteCourse(id);
            renderCoursesPage();
        };
    };

    const renderSettingsPage = () => {
        const uniName = localStorage.getItem('edu-uni-name') || "Toshkent Davlat Texnika Universiteti";
        const semester = localStorage.getItem('edu-semester') || '1';
        const el = document.getElementById('main-content');
        el.innerHTML = `
            <div class="page settings-page fade-in">
                <h1>Tizim sozlamalari</h1>
                <div style="margin:20px 0;">
                    <label>Universitet nomi:</label>
                    <input type="text" id="uni-name" value="${uniName}" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                </div>
                <div style="margin:20px 0;">
                    <label>Semester:</label>
                    <select id="semester" style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border-color);border-radius:8px;">
                        ${Array.from({length:8}, (_,i) => `<option value="${i+1}" ${semester == i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}
                    </select>
                </div>
                <div style="margin:20px 0;">
                    <button id="seed-btn" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Ma'lumotlarni yuklash</button>
                    <div id="seed-progress" style="display:none"></div>
                </div>
                <div style="margin:20px 0;">
                    <button id="logout-admin" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;">Chiqish</button>
                </div>
            </div>
        `;

        document.getElementById('uni-name').addEventListener('input', (e) => {
            localStorage.setItem('edu-uni-name', e.target.value);
        });
        document.getElementById('semester').addEventListener('change', (e) => {
            localStorage.setItem('edu-semester', e.target.value);
        });
        document.getElementById('seed-btn').addEventListener('click', async () => {
            const btn = document.getElementById('seed-btn');
            const progress = document.getElementById('seed-progress');
            btn.disabled = true;
            progress.style.display = 'block';
            await SeedData.run((message, percent) => {
                progress.innerHTML = `
                    <div class="progress-bar-wrap">
                        <div class="progress-bar" style="width:${percent}%"></div>
                    </div>
                    <p class="progress-msg">${message}</p>
                `;
            });
            btn.disabled = false;
            showToast("Ma'lumotlar muvaffaqiyatli yuklandi ✅");
        });
        document.getElementById('logout-admin').addEventListener('click', () => {
            window.Auth.logout();
        });
    };

    const renderSchedulePage = async () => {
        const tabs = document.getElementById('schedule-day-tabs');
        const content = document.getElementById('schedule-content');
        if (!tabs || !content) return;

        const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju'];
        const dayNumbers = { Du: '10', Se: '11', Ch: '12', Pa: '13', Ju: '14' };
        tabs.innerHTML = days.map((day) => `
            <div class="day-item" data-day="${day}">
                <span class="day-name">${day}</span>
                <span class="day-number">${dayNumbers[day]}</span>
            </div>
        `).join('');

        const setDay = async (day) => {
            tabs.querySelectorAll('.day-item').forEach((item) => {
                item.classList.toggle('active', item.getAttribute('data-day') === day);
            });
            await loadSection('#schedule-content', async () => {
                try {
                    return await MockDB.getSchedule({ day });
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return [];
                }
            }, renderScheduleContent);
        };

        tabs.querySelectorAll('.day-item').forEach((item) => {
            item.addEventListener('click', () => {
                setDay(item.getAttribute('data-day'));
            });
        });

        const today = getTodayShort();
        setDay(days.includes(today) ? today : 'Du');
    };

    const renderNotifications = async () => {
        if (!notificationDropdown) return;

        let notifications = [];
        try {
            notifications = await MockDB.getNotifications();
        } catch(e) {
            if (e.code === 'permission-denied') {
                console.warn('Permission denied — check Firestore Rules');
            }
        }
        updateNotificationCount(notifications.filter((item) => !item.isRead).length);

        notificationDropdown.innerHTML = notifications.map((item) => `
            <div class="notification-item${item.isRead ? ' read' : ''}" data-id="${item.id}">
                <h4>${item.title}</h4>
                <p>${item.body}</p>
                <small>${formatDate(item.time.split('T')[0])}</small>
            </div>
        `).join('');

        notificationDropdown.querySelectorAll('.notification-item').forEach((item) => {
            item.addEventListener('click', async () => {
                const id = item.getAttribute('data-id');
                await MockDB.markNotificationRead(id);
                renderNotifications();
            });
        });
    };

    const toggleNotificationPanel = async () => {
        if (notificationDropdown) {
            notificationDropdown.remove();
            notificationDropdown = null;
            return;
        }

        notificationDropdown = document.createElement('div');
        notificationDropdown.className = 'notification-dropdown';
        document.body.appendChild(notificationDropdown);
        await renderNotifications();
    };

    const bellButton = document.querySelector('.icon-btn');
    if (bellButton) {
        bellButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            await toggleNotificationPanel();
        });
    }

    document.addEventListener('click', (event) => {
        if (notificationDropdown && !notificationDropdown.contains(event.target) && !bellButton.contains(event.target)) {
            notificationDropdown.remove();
            notificationDropdown = null;
        }
    });

    const renderPage = (pageId) => {
        const session = Auth.getSession();
        if (!session) {
            Auth.logout();
            return;
        }

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Custom renders for teacher/admin pages
        if (pageId === 'teacher-dashboard') {
            renderTeacherDashboard();
            return; // ✅ teacher-dashboard render complete
        }

        if (pageId === 'attendance') {
            renderAttendancePage();
            return; // ✅ attendance render complete
        }

        if (pageId === 'grading') {
            renderGradingPage();
            return; // ✅ grading render complete
        }

        if (pageId === 'assignments') {
            renderAssignmentsPage();
            return; // ✅ assignments render complete
        }

        if (pageId === 'admin-dashboard') {
            renderAdminDashboard();
            return; // ✅ admin-dashboard render complete
        }

        if (pageId === 'users') {
            renderUsersPage();
            return; // ✅ users render complete
        }

        if (pageId === 'courses-admin') {
            renderCoursesPage();
            return; // ✅ courses-admin render complete
        }

        if (pageId === 'settings') {
            renderSettingsPage();
            return; // ✅ settings render complete
        }

        if (pageId === 'profile') {
            const session = Auth.getSession();
            const colors = ['#6C5CE7','#0984E3','#00B894','#E17055','#FDCB6E','#E84393'];
            let selectedColor = session.avatarColor || colors[0];
            const initials = (session.fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase();

            mainContent.innerHTML = `
                <div class="profile-page">
                  <div class="profile-avatar" id="profile-avatar" style="background:${selectedColor}">
                    ${initials}
                  </div>
                  <div class="form-group">
                    <label>Ism familiya</label>
                    <input id="profile-name" type="text" value="${session.fullName || ''}" placeholder="Ismingiz">
                  </div>
                  <div class="color-picker">
                    <label>Avatar rangi</label>
                    <div class="color-options" id="color-options">
                      ${colors.map(c => `<div class="color-circle ${c === selectedColor ? 'active' : ''}" style="background:${c}" data-color="${c}">${c === selectedColor ? '✓' : ''}</div>`).join('')}
                    </div>
                  </div>
                  <button class="btn-primary" id="save-profile-btn">Saqlash</button>
                </div>
              `;

            document.querySelectorAll('.color-circle').forEach(el => {
                el.addEventListener('click', () => {
                  selectedColor = el.dataset.color;
                  document.querySelectorAll('.color-circle').forEach(c => { c.classList.remove('active'); c.textContent = ''; });
                  el.classList.add('active');
                  el.textContent = '✓';
                  document.getElementById('profile-avatar').style.background = selectedColor;
                });
              });

            document.getElementById('save-profile-btn').addEventListener('click', async () => {
                const newName = document.getElementById('profile-name').value.trim();
                if (!newName) { showToast('Ismni kiriting'); return; }
                try {
                  await MockDB.updateProfile(session.uid, { fullName: newName, avatarColor: selectedColor });
                  const hName = document.getElementById('header-name');
                  const hAvatar = document.getElementById('header-avatar');
                  if (hName) hName.textContent = newName;
                  if (hAvatar) hAvatar.style.background = selectedColor;
                  showToast('Profil yangilandi ✅');
                } catch(e) {
                  if (e.code === 'permission-denied') {
                    console.warn('Permission denied — check Firestore Rules');
                  }
                  showToast('Xatolik yuz berdi');
                }
              });
            return; // ✅ profile render complete
        }

        // Template-based renders
        const template = document.getElementById(`page-${pageId}`);
        if (!template) return;

        mainContent.innerHTML = '';
        const clone = template.content.cloneNode(true);
        mainContent.appendChild(clone);

        mainContent.classList.remove('fade-in');
        requestAnimationFrame(() => {
            mainContent.classList.add('fade-in');
        });

        if (pageId === 'dashboard') {
            loadSection('#dashboard-profile', async () => {
                try {
                    return await MockDB.getStudent();
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return null;
                }
            }, renderDashboardStudent);
            loadSection('#dashboard-stats', async () => {
                try {
                    return await MockDB.getStats();
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return null;
                }
            }, renderDashboardStats);
            loadSection('#dashboard-today-schedule', async () => {
                try {
                    return await MockDB.getSchedule({ day: getTodayShort() });
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return [];
                }
            }, renderDashboardSchedule);
            loadSection('#dashboard-tasks', async () => {
                try {
                    return await MockDB.getTasks();
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return [];
                }
            }, renderDashboardTasks);
        } // ✅ dashboard render complete

        if (pageId === 'courses') {
            loadSection('#courses-grid', async () => {
                try {
                    return await MockDB.getCourses();
                } catch(e) {
                    if (e.code === 'permission-denied') {
                        console.warn('Permission denied — check Firestore Rules');
                    }
                    return [];
                }
            }, renderCourseCards);
        } // ✅ courses render complete

        if (pageId === 'schedule') {
            renderSchedulePage();
        } // ✅ schedule render complete

        if (pageId === 'grades') {
            renderGradesPage();
        } // ✅ grades render complete
    };

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            renderPage(target);
            setActiveNav(target);
            sessionStorage.setItem('edumanage-page', target);
        });
    });

    renderPage(initialPage);
    setActiveNav(initialPage);

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (window.Auth) {
                window.Auth.logout();
            }
        });
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(() => console.log('Service Worker registration failed'));
    }
};

window.initApp = initApp;

document.addEventListener("DOMContentLoaded", () => {
    if (window.Auth && window.Auth.isLoggedIn()) {
        initApp();
    } else {
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.style.display = 'none';
    }
});

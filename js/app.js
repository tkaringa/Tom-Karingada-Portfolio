const bootSequence = [
    "INITIALIZING CONNECTION TO SECURE ENIRONMENT...",
    "CONFIGURING USER PREFERENCES...",
    "LOADING MANIFEST...",
    "SYSTEM READY."
];

const bootScreen = document.getElementById('boot-screen');
const bootTextContainer = document.getElementById('boot-text');
const mainInterface = document.getElementById('main-interface');
const clockElement = document.getElementById('clock');
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

let bootLineIndex = 0;
let bootTimeoutId = null;

function runBootSequence() {
    if (bootLineIndex < bootSequence.length) {
        const line = document.createElement('div');
        line.textContent = bootSequence[bootLineIndex];
        bootTextContainer.appendChild(line);
        bootLineIndex++;
        
        let delay = Math.random() * 400 + 200;
        if (bootLineIndex === bootSequence.length) delay = 800; 
        
        bootTimeoutId = setTimeout(runBootSequence, delay);
    } else {
        finishBoot();
    }
}

function finishBoot() {
    bootScreen.classList.add('hidden');
    mainInterface.classList.remove('hidden');
    const timeline = document.getElementById('master-timeline-container');
    if (timeline) timeline.classList.remove('hidden');
}

function skipBoot() {
    if (bootTimeoutId) clearTimeout(bootTimeoutId);
    finishBoot();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !bootScreen.classList.contains('hidden')) {
        skipBoot();
    }
});

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

let highestZ = 10;
const statusObj = document.getElementById('status-bar');
const statusMessages = {
    'about': '> ACCESSING USER INFORMATION...',
    'projects': '> LOADING PROJECTS...',
    'gallery': '> SECURING PHYSICAL EVIDENCE...',
    'resume': '> VERIFYING WORK RECORD...',
    'research': '> ANALYZING RESEARCH...',
    'contact': '> ESTABLISHING SECURE TRANSMISSION...'
};

navButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        const targetId = button.getAttribute('data-target');
        if (statusObj && statusMessages[targetId]) {
            statusObj.textContent = statusMessages[targetId];
        }
    });
    
    button.addEventListener('mouseleave', () => {
        if (statusObj) statusObj.textContent = '> SYSTEM IDLE. WAITING FOR INPUT.';
    });

    button.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const targetId = button.getAttribute('data-target');
        contentSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
                // Trigger scatter if gallery is opened
                if (targetId === 'gallery') scatterPolaroids();
            } else {
                section.classList.add('hidden');
            }
        });
    });
});

const polaroids = document.querySelectorAll('.polaroid');
let hasScattered = false;

function scatterPolaroids() {
    if (hasScattered) return;
    
    polaroids.forEach(p => {
        const rot = (Math.random() - 0.5) * 40;
        const x = Math.random() * 50 + 5; 
        const y = Math.random() * 40 + 5; 
        
        p.style.transform = `rotate(${rot}deg)`;
        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        p.dataset.rot = rot;
        
        let isDragging = false;
        let hasMoved = false;
        let startX, startY;
        let origMouseX, origMouseY;
        let currentX, currentY;
        let dragRAF;

        p.addEventListener('mousedown', startDrag);
        p.addEventListener('touchstart', startDrag, {passive: false});

        function startDrag(e) {
            if (e.target.classList.contains('polaroid') || e.target.closest('.polaroid')) {
                isDragging = true;
                hasMoved = false;
                highestZ++;
                p.style.zIndex = highestZ;
                p.style.transition = 'none'; // stop transition fighting drag
                p.style.willChange = 'left, top, transform'; // Hint for GPU
                p.style.transform = `scale(1.05) rotate(${p.dataset.rot}deg)`;
                
                const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
                const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
                
                origMouseX = clientX;
                origMouseY = clientY;
                startX = clientX - p.offsetLeft;
                startY = clientY - p.offsetTop;
                currentX = clientX;
                currentY = clientY;

                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', endDrag);
                document.addEventListener('touchmove', onDrag, {passive: false});
                document.addEventListener('touchend', endDrag);

                // Use requestAnimationFrame for smooth movement
                dragRAF = requestAnimationFrame(dragLoop);
            }
        }

        function onDrag(e) {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling on mobile
            currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            
            if (Math.abs(currentX - origMouseX) > 5 || Math.abs(currentY - origMouseY) > 5) {
                hasMoved = true;
            }
        }
        
        function dragLoop() {
            if (!isDragging) return;
            p.style.left = `${currentX - startX}px`;
            p.style.top = `${currentY - startY}px`;
            dragRAF = requestAnimationFrame(dragLoop);
        }

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            cancelAnimationFrame(dragRAF);
            p.style.transition = ''; // Restore transition
            p.style.willChange = 'auto'; // Release GPU cache
            p.style.transform = `rotate(${p.dataset.rot}deg)`; 
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', endDrag);

            if (!hasMoved) {
                openInspector(p);
            }
        }
    });
    hasScattered = true;
}

const inspector = document.getElementById('polaroid-inspector');
const inspectorClose = document.getElementById('close-inspector');
const inspectorTitle = document.getElementById('inspector-title');
const inspectorDesc = document.getElementById('inspector-desc');
const inspectorImage = document.getElementById('inspector-image-container');

function openInspector(polaroidEl) {
    if (!inspector) return;
    const title = polaroidEl.getAttribute('data-title');
    const desc = polaroidEl.getAttribute('data-desc');
    const imgEl = polaroidEl.querySelector('.polaroid-img');
    
    if (inspectorTitle) inspectorTitle.textContent = title;
    if (inspectorDesc) inspectorDesc.textContent = desc;
    
    if (inspectorImage && imgEl) {
        inspectorImage.style.cssText = imgEl.style.cssText;
        inspectorImage.innerHTML = imgEl.innerHTML;
    }
    
    inspector.classList.remove('hidden');
}

if (inspectorClose) {
    inspectorClose.addEventListener('click', () => {
        inspector.classList.add('hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const crtToggle = document.getElementById('crt-toggle');
    if (crtToggle) {
        crtToggle.checked = true;
        document.body.classList.remove('crt-off');
    }

    const skipBtn = document.getElementById('skip-boot');
    if (skipBtn) skipBtn.addEventListener('click', skipBoot);

    initThemeSelector();

    bootTimeoutId = setTimeout(runBootSequence, 500);
    setInterval(updateClock, 1000);
    updateClock();
});

function initThemeSelector() {
    const nodes = document.querySelectorAll('.timeline-node');
    const branchPath = document.getElementById('branch-path');

    const savedTheme = 'theme-base'; // Default to archive directly on refresh without localStorage

    // Check saved theme and activate  instantly
    nodes.forEach(node => {
        if (node.getAttribute('data-theme') === savedTheme) {
            activateTheme(node, false); 
        }
    });

    nodes.forEach(node => {
        node.addEventListener('click', (e) => {
            activateTheme(node, true);
        });
    });
}

function activateTheme(selectedNode, animate) {
    const nodes = document.querySelectorAll('.timeline-node');
    const branchPath = document.getElementById('branch-path');
    
    // Reset Actives
    nodes.forEach(n => n.classList.remove('active'));
    selectedNode.classList.add('active');

    // Apply theme transition
    const newTheme = selectedNode.getAttribute('data-theme');
    
    if (animate) {
        document.body.style.opacity = '0.1';
        document.body.style.filter = 'brightness(3) contrast(150%) hue-rotate(90deg)';
        setTimeout(() => {
            applyThemeClass(newTheme);
            document.body.style.opacity = '1';
            document.body.style.filter = 'none';
        }, 300);
    } else {
        applyThemeClass(newTheme);
    }

}

function applyThemeClass(newTheme) {
    document.body.className = ''; 
    document.body.classList.add(newTheme);
}

const crtToggle = document.getElementById('crt-toggle');
crtToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.remove('crt-off');
    } else {
        document.body.classList.add('crt-off');
    }
});

const approvalStamp = document.getElementById('approval-stamp');
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.getAttribute('data-target') === 'resume') {
            setTimeout(() => {
                approvalStamp.classList.add('stamped');
            }, 600);
        } else {
            approvalStamp.classList.remove('stamped');
        }
    });
});

const pruneBtn = document.getElementById('prune-btn');
if (pruneBtn) {
    pruneBtn.addEventListener('click', () => {
        document.body.classList.add('glitch-anim');
        setTimeout(() => {
            bootLineIndex = 0;
            bootTextContainer.innerHTML = '';
            mainInterface.classList.add('hidden');
            const timeline = document.getElementById('master-timeline-container');
            if (timeline) timeline.classList.add('hidden');
            bootScreen.classList.remove('hidden');
            document.body.classList.remove('glitch-anim');
            setTimeout(runBootSequence, 1000);
        }, 1000);
    });
}

const contactForm = document.getElementById('contact-form');
const transmissionStatus = document.getElementById('transmission-status');
const progressBar = document.getElementById('progress-bar');
const transmissionResult = document.getElementById('transmission-result');
const resetCommsBtn = document.getElementById('reset-comms-btn');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactForm.classList.add('hidden');
        transmissionStatus.classList.remove('hidden');
        transmissionResult.classList.add('hidden');
        resetCommsBtn.classList.add('hidden');
        
        let progress = 0;
        const totalLength = 20;
        
        const interval = setInterval(() => {
            progress++;
            const filled = '█'.repeat(progress);
            const empty = '.'.repeat(totalLength - progress);
            progressBar.textContent = `[${filled}${empty}]`;
            
            // Fake varying connection speeds
            const randDelay = Math.random() * 50;
            
            if (progress >= totalLength) {
                clearInterval(interval);
                
                const nameValue = document.getElementById('sender-name') ? document.getElementById('sender-name').value : '';
                const emailValue = document.getElementById('sender-email') ? document.getElementById('sender-email').value : '';
                const messageValue = document.getElementById('sender-message') ? document.getElementById('sender-message').value : '';

                const mailto = `mailto:tomkaringada04@gmail.com?subject=Transmission%20from%20${encodeURIComponent(nameValue)}&body=${encodeURIComponent(messageValue + '\n\n---\nSender Email: ' + emailValue)}`;
                window.location.href = mailto;

                setTimeout(() => {
                    transmissionResult.classList.remove('hidden');
                    resetCommsBtn.classList.remove('hidden');
                }, 400);
            }
        }, 100 + Math.random() * 80); // uneven progress
    });

    resetCommsBtn.addEventListener('click', () => {
        contactForm.reset();
        contactForm.classList.remove('hidden');
        transmissionStatus.classList.add('hidden');
        progressBar.textContent = '[....................]';
    });
}


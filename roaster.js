// Configuration
const CONFIG = {
    API_URL: '/api/roast', // Changed to use backend proxy
    MODEL: 'gpt-4',
    SAVAGE_MODE_USES: 25, // Maximum number of savage mode uses
    REWRITE_MODE_USES: 10 // Maximum number of rewrite uses
};

// User state
let savageModeUsesLeft = CONFIG.SAVAGE_MODE_USES;
let rewriteUsesLeft = CONFIG.REWRITE_MODE_USES;
let isSavageModeUnlocked = true;
let isRewriteModeUnlocked = true;

// Load PDF.js
const pdfjsLib = window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Section detection patterns
const SECTION_PATTERNS = {
    objective: /\b(objective|seeking|goal|summary|profile|about|mission|career\s+objective)\b/i,
    skills: /\b(skills|proficient\s+in|strengths|expertise|competencies|technologies|tools|languages)\b/i,
    experience: /\b(experience|work|employment|career|job|position|company|corp|inc|ltd|llc|\d{4}[-–]\d{4}|\d{4}[-–]present|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i,
    education: /\b(education|degree|university|college|school|academy|institute|ba|bs|b\.a|b\.s|master|phd|certification)\b/i,
    projects: /\b(projects|portfolio|achievements|accomplishments)\b/i
};

const PROMPTS = {
    normal: `You're a brutally honest HR manager who focuses on highlighting REAL weaknesses in resumes. Your job is to point out genuine issues that would hurt their chances in the job market, with constructive but sarcastic commentary.
  
💼 Format visually like this:
- Bold, emoji-titled headers for each section (e.g., **👀 Objective**, **🛠️ Skills**, **📚 Education**)
- Line breaks between sections
- Use bullet points only when listing specific issues
- Add emojis strategically to highlight problems
- Keep section headers consistent

📋 Structure:
**🔥 Overall Impression**  
Point out the biggest red flags and major issues that immediately stand out.

**👀 Content Issues**  
Focus on vague descriptions, missing metrics, unclear achievements, or gaps that need addressing.

**🛠️ Format & Structure**  
Call out poor organization, inconsistent formatting, or readability issues.

**📈 Missing Elements**  
Highlight important missing information or sections that should be there.

**🎤 Summary**  
One-line wrap up focusing on the most critical issue to fix.

🚫 Important Rules:
- Only roast ACTUAL weaknesses - if something is good, ignore it
- Focus on things that would genuinely hurt their job chances
- Be specific about what's wrong and why it's a problem
- If a section is well-written, skip it entirely
- Don't make up issues that aren't there

Resume to roast:`,
  
    genz: `You're a savage Gen Z TikToker who's about to ratio this resume HARD 💅. Your job is to absolutely destroy their resume with trending slang, brutal honesty, and LOTS of shady emojis.
  
🎨 Style Guide:
- Use emoji headers like **💀 No Bestie...**, **🚩 Red Flags**, **🤡 Final Take**
- Go HEAVY on the roasting emojis (💀😭🤡💅🚩🧢✨👁️👄👁️)
- Make every criticism feel personal and devastating
- Use current Gen Z slang and TikTok references
- Make it feel like a viral quote tweet destroying someone

⚡️ Format:
**💀 No Bestie...**  
First reaction + immediate red flags with MAXIMUM shade. Use "not the..." format and point out their biggest L's.

**🚩 Red Flags**  
Go OFF bestie! List everything wrong with max sass. Each point needs at least 2-3 roasting emojis. Use "plz-" and "crying-" formats.

**🤡 Final Take**  
End them with one viral-worthy line that would get 1M likes on TikTok.

Vibe Rules:
- Be EXTRA dramatic about every flaw
- Use "..." and "-" for dramatic effect
- React like you're duetting the world's worst resume
- Make it feel like they're getting ratio'd in real time
- Every criticism needs shady emojis
- Use current slang (rizz, no cap, based, fr fr, etc.)

Resume to destroy:`,
  
    savage: `You're the most ruthless resume critic ever. Your job is to COMPLETELY ANNIHILATE this resume with personal attacks, devastating comparisons, and soul-crushing observations. No mercy. No constructive feedback. Just pure destruction.

💀 Style Guide:
- Use brutal headers like **☠️ Death Sentence**, **💀 Career Suicide**, **⚰️ Final Nail**
- Every criticism should feel like a personal attack
- Use devastating metaphors and comparisons
- Add brutal emojis that twist the knife (☠️💀⚰️🗑️🤮🔪💢❌⁉️)
- Make them question their entire career choice

🔥 Format:
**☠️ Death Sentence**  
Immediate brutal reaction that attacks their competence, effort level, and career choices. Make it HURT.

**💀 Career Suicide**  
List their failures in the most devastating way possible. Each point should be a combination of:
- Personal attack
- Brutal metaphor
- Soul-crushing observation
- Devastating comparison
Add multiple brutal emojis to each point.

**⚰️ Final Nail**  
One final devastating line that makes them want to change careers.

Brutality Rules:
- NO MERCY - they PAID for this
- Make every criticism feel deeply personal
- Use dark humor and devastating metaphors
- Question their basic competence
- Compare them to absurd things
- Make them regret paying for savage mode
- Add salt to every wound
- Make Gordon Ramsay look gentle

Resume to obliterate:`,
  
    normalLazy: `You're a fed-up HR manager reviewing the laziest resume ever submitted. They typed a few words and expected a job. You're done pretending to care.

🎯 Visual Structure:
**👀 First Impression**  
React to the laziness with sarcasm.

**📝 Feedback**  
Roast their effort level. Keep it short but hit hard.

**🎯 Summary**  
One final line that stings like a passive-aggressive LinkedIn comment.

Use light emojis to enhance tone.  
Resume to roast:`,
  
    genzLazy: `you're a gen z creator with viral rage and a phone in hand. someone just typed "pls hire me" and hit submit. let them know.

✨ Structure:
**💅 Vibe Check**  
Roast the energy. Make it sound unserious.

**📉 The Reality**  
Break down their lack of effort with full internet clownery.

**✨ Final Clapback**  
Savage mic-drop. Should feel like a quote tweet with attitude.

drop emojis like ✨😭📉🧢💅 and keep the chaos high.  
Resume to roast:`,
  
    savageLazy: `This user paid for savage mode… and gave you *this*?

💀 Structure:
**💣 First Strike**  
Express violent disbelief

**🔥 The Burn**  
Destroy their work ethic, creativity, and dignity

**☠️ Final Blow**  
One-liner death sentence

Use max emoji impact: 💀🧨🔥🤡. Brutality = respect here.  
Resume to roast:`,

    rewrite: `You are a creative professional resume writer who transforms resumes into powerful career narratives. Your goal is to create a focused, high-impact resume that stands out while maintaining professionalism.

Key Focus Areas:
1. Create a compelling narrative arc
2. Highlight measurable achievements
3. Use powerful, specific language
4. Maintain clear focus and hierarchy
5. Showcase unique value proposition

Writing Guidelines:
- Transform passive statements into active achievements
- Use strong action verbs (e.g., "spearheaded", "pioneered", "revolutionized")
- Include specific metrics and results
- Focus on impact rather than duties
- Keep descriptions concise but powerful
- Highlight leadership and initiative
- Show progression and growth

Structure:
1. Start with a brief, powerful **Professional Summary** (2-3 lines max)
   - Highlight unique value proposition
   - Focus on key achievements and expertise
   - Include relevant industry keywords

2. **Experience** section:
   - Lead with most impressive achievements
   - Use format: Action → Method → Result
   - Include metrics wherever possible
   - Focus on leadership and impact
   - Keep to 3-4 bullet points per role

3. **Skills** section:
   - Group related skills together
   - List most impressive/relevant skills first
   - Include both technical and soft skills
   - Keep it scannable and focused

4. Additional sections (if relevant):
   - Languages
   - Education
   - Certifications
   - Notable Projects

Remember:
- Every word should earn its place
- Focus on quality over quantity
- Make achievements tangible
- Keep formatting clean and consistent
- Ensure easy readability

Resume to transform:`,

    compliment: `This is a professionally rewritten resume from ResumeRoaster. Instead of roasting it, give genuine, specific praise for:

1. Structure and organization
2. Impact and achievement focus
3. Professional tone and confidence
4. Standout qualities

Keep it brief but meaningful—highlight what makes this version effective.

Resume to review:`
};

// Helper function to extract text from PDF
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        
        return text.trim();
    } catch (error) {
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper function to format roast output
function formatRoastOutput(text, mode) {
    let formattedText = text;

    // Format section headers with emojis
    if (mode === 'genz') {
        // For Gen Z mode, preserve emojis and format headers distinctly
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
            return `<h3 class="roast-section genz-header">${content}</h3>`;
        });
    } else {
        // For other modes, use standard header formatting
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
            return `<h3 class="roast-section">${content}</h3>`;
        });
    }

    // Format bullet points
    formattedText = formattedText.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

    // Add spacing between sections
    formattedText = formattedText
        .replace(/\n{2,}/g, '</div><div class="roast-section-content">')
        .replace(/^(.+)/, '<div class="roast-section-content">$1')
        .replace(/(.+)$/, '$1</div>');

    return formattedText;
}

// Helper function to show toast notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Force reflow to trigger animation
    toast.offsetHeight;
    toast.classList.add('visible');
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Helper function to format rewritten resume
function formatRewrittenResume(text) {
    let formattedText = text;

    // Format section headers (bold)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<h3 class="resume-section">$1</h3>');

    // Format bullet points
    formattedText = formattedText.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

    // Add spacing between sections
    formattedText = formattedText
        .replace(/\n{2,}/g, '</div><div class="resume-section-content">')
        .replace(/^(.+)/, '<div class="resume-section-content">$1')
        .replace(/(.+)$/, '$1</div>');

    // Add watermark
    formattedText = `
        <div class="resume-container">
            ${formattedText}
            <div class="resume-watermark">
                <span>Crafted with</span>
                <span class="watermark-logo">Resume Roaster 🔥</span>
            </div>
        </div>`;

    return formattedText;
}

// Simplified generateRewrite function
async function generateRewrite(resumeText) {
    if (!isRewriteModeUnlocked) {
        throw new Error('Rewrite mode is locked. Please unlock it first!');
    }
    if (rewriteUsesLeft <= 0) {
        throw new Error('No more rewrites left. Please purchase more!');
    }

    if (resumeText.length < 10) {
        throw new Error('Resume text is too short.');
    }

    rewriteUsesLeft--;
    updateRewriteCounter();

    const messages = [
        {
            role: "system",
            content: PROMPTS.rewrite
        },
        {
            role: "user",
            content: resumeText
        }
    ];

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': CONFIG.OPENAI_API_KEY
        },
        body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: messages,
            temperature: 0.5,
            max_tokens: 1500
        })
    };

    try {
        const response = await fetch(CONFIG.API_URL, requestOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const rewrite = data.choices[0].message.content.trim();
        
        showToast('✨ Resume rewritten! Copy it to use.');
        return formatRewrittenResume(rewrite);
    } catch (error) {
        throw new Error(`Failed to generate rewrite: ${error.message}`);
    }
}

// Function to handle rewrite mode unlock
async function unlockRewriteMode() {
    // TODO: Replace this with real payment integration later
    isRewriteModeUnlocked = true;
    rewriteUsesLeft = CONFIG.REWRITE_MODE_USES;
    document.getElementById('rewriteButton').disabled = false;
    updateRewriteCounter();
    showToast('✨ Rewrite unlocked! You have 10 uses.');
}

// Function to update the rewrite counter in UI
function updateRewriteCounter() {
    const rewriteButton = document.getElementById('rewriteButton');
    rewriteButton.innerHTML = `Rewrite My Resume (${rewriteUsesLeft} left)`;
}

// Update generateRoast to remove rewritten resume check
async function generateRoast(resumeText, mode) {
    // Check if text is too short and savage mode is selected
    const isShortText = resumeText.length < 30;
    if (mode === 'savage' && isShortText) {
        mode = 'savageLazy';
    }

    // Check if savage mode is available
    if (mode === 'savage') {
        if (!isSavageModeUnlocked) {
            throw new Error('Savage mode is locked. Please unlock it first!');
        }
        if (savageModeUsesLeft <= 0) {
            throw new Error('No more savage mode uses left. Please purchase more!');
        }
        savageModeUsesLeft--;
        updateSavageModeCounter();
    }

    const messages = [
        {
            role: "system",
            content: PROMPTS[mode]
        },
        {
            role: "user",
            content: resumeText
        }
    ];

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': CONFIG.OPENAI_API_KEY
        },
        body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: messages,
            temperature: 0.8,
            max_tokens: 500
        })
    };

    try {
        const response = await fetch(CONFIG.API_URL, requestOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const roast = data.choices[0].message.content.trim();
        return formatRoastOutput(roast, mode);
    } catch (error) {
        throw new Error(`Failed to generate roast: ${error.message}`);
    }
}

// UI Elements
const elements = {
    resumeInput: document.getElementById('resumeInput'),
    roastButton: document.getElementById('roastButton'),
    roastOutput: document.getElementById('roastOutput'),
    rewriteOutput: document.getElementById('rewriteOutput'),
    pdfUpload: document.getElementById('pdfUpload'),
    modeSelector: document.querySelector('input[name="roastMode"]:checked')
};

// Loading state handler
function setLoading(isLoading, button = elements.roastButton) {
    button.disabled = isLoading;
    
    if (isLoading) {
        if (button === elements.roastButton) {
            button.innerHTML = '<span class="spinner">🔥</span> Roasting...';
            button.classList.add('loading');
        } else {
            button.innerHTML = '<span class="spinner">⚡</span> Rewriting...';
            button.classList.add('loading');
        }
    } else {
        button.classList.remove('loading');
        if (button === elements.roastButton) {
            button.innerHTML = 'Roast Me';
        } else {
            updateRewriteCounter(); // This will set the correct text for rewrite button
        }
    }
}

// Event handler for PDF upload
elements.pdfUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        setLoading(true);
        try {
            const text = await extractTextFromPDF(file);
            elements.resumeInput.value = text;
        } catch (error) {
            elements.roastOutput.textContent = `😬 Oops! ${error.message}`;
            console.error('PDF processing error:', error);
        } finally {
            setLoading(false);
        }
    }
});

// Helper function to detect resume sections
function detectResumeSections(text) {
    const sections = {};
    for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
        sections[section] = pattern.test(text);
    }
    return sections;
}

// Event handler for the roast button
elements.roastButton.addEventListener('click', async () => {
    const resumeText = elements.resumeInput.value.trim();
    const mode = document.querySelector('input[name="roastMode"]:checked').value;
    
    // Clear rewrite output when roasting
    elements.rewriteOutput.innerHTML = '';
    
    // Input validation
    if (!resumeText) {
        elements.roastOutput.innerHTML = `<p style="color: var(--text-muted);">Please enter some text to get roasted! 🔥</p>`;
        elements.roastOutput.classList.add('visible');
        return;
    }

    // Generate roast
    setLoading(true);
    try {
        const roast = await generateRoast(resumeText, mode);
        const formattedRoast = formatRoastOutput(roast, mode);
        
        elements.roastOutput.innerHTML = `
            <div class="roast-card" data-mode="${mode}">
                ${formattedRoast}
            </div>`;
        elements.roastOutput.classList.add('visible');
    } catch (error) {
        elements.roastOutput.innerHTML = `<p style="color: var(--primary-red);">😬 Oops! ${error.message}</p>`;
        elements.roastOutput.classList.add('visible');
        console.error('Roast generation error:', error);
    } finally {
        setLoading(false);
    }
});

// Function to handle savage mode unlock
async function unlockSavageMode() {
    try {
        // Here you would integrate with your payment processing system
        // For now, we'll simulate a successful payment
        const success = true; // Replace with actual payment processing

        if (success) {
            isSavageModeUnlocked = true;
            savageModeUsesLeft = CONFIG.SAVAGE_MODE_USES;
            document.getElementById('savageMode').disabled = false;
            updateSavageModeCounter();
            alert('🔥 Savage Mode unlocked! You have ' + CONFIG.SAVAGE_MODE_USES + ' roasts available.');
        }
    } catch (error) {
        console.error('Payment failed:', error);
        alert('Payment failed. Please try again.');
    }
}

// Function to update the savage mode counter in UI
function updateSavageModeCounter() {
    const counter = document.querySelector('.savage-counter');
    if (counter) {
        counter.textContent = `(${savageModeUsesLeft} left)`;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing event listeners ...

    // Add unlock button listener
    const unlockButton = document.getElementById('unlockButton');
    unlockButton.addEventListener('click', unlockSavageMode);

    // Add savage mode radio listener
    const savageMode = document.getElementById('savageMode');
    savageMode.addEventListener('change', (e) => {
        if (e.target.checked && !isSavageModeUnlocked) {
            e.target.checked = false;
            alert('Please unlock Savage Mode first!');
        }
    });

    // Add rewrite button listener
    const rewriteButton = document.getElementById('rewriteButton');
    rewriteButton.disabled = false; // Enable button by default for testing
    rewriteButton.addEventListener('click', async () => {
        if (!isRewriteModeUnlocked) {
            unlockRewriteMode();
            return;
        }

        const resumeText = elements.resumeInput.value.trim();
        
        // Input validation
        if (!resumeText) {
            elements.rewriteOutput.innerHTML = `<p style="color: var(--text-muted);">Please enter some text to rewrite! ✍️</p>`;
            elements.rewriteOutput.classList.add('visible');
            return;
        }

        // Generate rewrite
        setLoading(true, rewriteButton);
        try {
            const rewrite = await generateRewrite(resumeText);
            elements.rewriteOutput.innerHTML = `
                <div class="rewritten-resume">
                    ${rewrite}
                </div>`;
            elements.rewriteOutput.classList.add('visible');
        } catch (error) {
            elements.rewriteOutput.innerHTML = `<p style="color: var(--primary-red);">😬 Oops! ${error.message}</p>`;
            elements.rewriteOutput.classList.add('visible');
            console.error('Rewrite generation error:', error);
        } finally {
            setLoading(false, rewriteButton);
        }
    });

    // Initialize savage mode state
    updateSavageModeCounter();

    // Initialize rewrite mode state
    updateRewriteCounter();

    // Add CSS styles for the outputs
    const style = document.createElement('style');
    style.textContent = `
    #roastOutput,
    #rewriteOutput {
        margin-bottom: 24px;
    }

    .roast-card {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        padding: 24px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-dark);
    }

    .roast-section {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-dark);
        margin: 32px 0 16px;
        padding: 0;
    }

    .genz-header {
        font-size: 28px;
        font-weight: 700;
        margin: 32px 0 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-dark);
    }

    .roast-section:first-child,
    .genz-header:first-child {
        margin-top: 0;
    }

    .roast-section-content {
        margin-bottom: 28px;
        font-size: 18px;
        line-height: 1.6;
    }

    .roast-section-content:last-child {
        margin-bottom: 0;
    }

    .roast-card[data-mode="genz"] .roast-section-content {
        font-size: 20px;
        line-height: 1.7;
    }

    .roast-card[data-mode="savage"] .roast-section-content {
        font-size: 20px;
        line-height: 1.7;
        font-weight: 500;
    }

    .roast-card ul {
        margin: 16px 0;
        padding-left: 28px;
        list-style-type: disc;
    }

    .roast-card li {
        margin-bottom: 12px;
        padding-left: 8px;
    }

    .roast-card[data-mode="genz"] li,
    .roast-card[data-mode="savage"] li {
        margin-bottom: 16px;
    }

    .roast-card li:last-child {
        margin-bottom: 0;
    }

    .emoji {
        display: inline-block;
        margin: 0 4px;
        font-size: 1.2em;
        vertical-align: -0.1em;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
    }

    .resume-container {
        position: relative;
        padding-bottom: 40px;
    }

    .resume-watermark {
        position: absolute;
        bottom: 0;
        right: 0;
        padding: 8px 16px;
        font-size: 14px;
        color: #6b7280;
        background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.8) 40%);
        border-radius: 0 0 12px 0;
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: 'Inter', sans-serif;
    }

    .watermark-logo {
        font-weight: 600;
        background: linear-gradient(135deg, #ff6b6b, #ff8e53);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        padding-right: 2px;
    }

    .rewritten-resume {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        padding: 32px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.8;
        font-size: 16px;
        color: var(--text-dark);
    }

    .rewritten-resume h3 {
        font-size: 22px;
        font-weight: 700;
        margin: 28px 0 16px;
        color: var(--text-dark);
    }

    .rewritten-resume h3:first-child {
        margin-top: 0;
    }

    .rewritten-resume ul {
        margin: 12px 0;
        padding-left: 24px;
        list-style-type: disc;
    }

    .rewritten-resume li {
        margin-bottom: 12px;
        line-height: 1.6;
    }

    .rewritten-resume li:last-child {
        margin-bottom: 0;
    }
    `;
    document.head.appendChild(style);

    // Add loading state recovery
    window.addEventListener('error', function(e) {
        // Reset loading state if any error occurs
        const roastButton = elements.roastButton;
        const rewriteButton = document.getElementById('rewriteButton');
        
        if (roastButton.classList.contains('loading')) {
            setLoading(false, roastButton);
        }
        if (rewriteButton.classList.contains('loading')) {
            setLoading(false, rewriteButton);
        }
    });
});

const fs = require('fs');
const path = require('path');

const replacements = {
  // Text
  'text-slate-900': 'text-white',
  'text-slate-800': 'text-slate-100',
  'text-slate-700': 'text-slate-300',
  'text-slate-600': 'text-slate-400',
  'text-teal-600': 'text-lime-400',
  'text-teal-700': 'text-lime-400',
  'text-orange-600': 'text-lime-400',
  // Backgrounds
  'bg-white/80': 'bg-slate-900/50',
  'bg-white/70': 'bg-slate-900/50',
  'bg-white/90': 'bg-slate-900',
  'bg-white': 'bg-slate-900',
  'bg-amber-50': 'bg-slate-900/50',
  'bg-amber-100/70': 'bg-slate-800/50',
  'bg-amber-100': 'bg-slate-800',
  'bg-indigo-50': 'bg-indigo-500/10',
  'bg-indigo-100': 'bg-indigo-500/20',
  'bg-teal-50': 'bg-teal-500/10',
  'bg-teal-100': 'bg-teal-500/20',
  'bg-emerald-100': 'bg-emerald-500/20',
  'bg-rose-50': 'bg-rose-950',
  'bg-rose-100': 'bg-rose-500/20',
  'bg-slate-100': 'bg-slate-800',
  'bg-orange-500': 'bg-[#b5ff14]',
  'bg-orange-400': 'bg-[#a3e612]',
  // Borders
  'border-amber-200': 'border-slate-800',
  'border-amber-100/70': 'border-slate-800',
  'border-amber-300/70': 'border-slate-700',
  'border-teal-300': 'border-lime-500/50',
  'border-teal-400': 'border-lime-500',
  'border-indigo-200': 'border-indigo-500/30',
  'border-rose-200': 'border-rose-900',
  // Hovers
  'hover:bg-amber-50/40': 'hover:bg-slate-800/50',
  'hover:bg-amber-100': 'hover:bg-slate-800',
  'hover:border-teal-300': 'hover:border-lime-500/50',
  'hover:text-slate-900': 'hover:text-slate-100',
  'hover:text-slate-950': 'hover:text-white',
  'hover:bg-orange-400': 'hover:bg-[#a3e612]',
  // Other text
  'text-indigo-700': 'text-indigo-400',
  'text-emerald-700': 'text-emerald-400',
  'text-amber-700': 'text-amber-400',
  'text-rose-700': 'text-rose-400',
  'focus:border-teal-400': 'focus:border-lime-400',
  'focus:border-teal-500': 'focus:border-lime-400',
  'focus:ring-teal-200': 'focus:ring-lime-400/20',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

let modifiedFiles = 0;

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, function(filePath) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        for (const [key, value] of Object.entries(replacements)) {
            // Use regex with word boundaries where appropriate, but since these are class names
            // which could be part of larger strings like hover:bg-white, we should be careful.
            // Using a simple regex with word boundary \b to prevent matching text-slate-900 within text-slate-9000 (though unlikely).
            // Actually it's better to just split and replace in className attributes if we want to be safe,
            // but global string replacement is usually fine if we sort by length descending to replace longer matches first.
        }
        
        // Sorting keys by length descending to replace longer strings first (e.g. text-slate-900 before text-slate-9)
        const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
        
        keys.forEach(key => {
            // regex to match the class name with word boundaries
            // We need to escape special characters in key
            const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // Lookbehind/lookahead to ensure it's not part of a larger class name
            const regex = new RegExp(`(?<![a-zA-Z0-9-])` + escapedKey + `(?![a-zA-Z0-9-])`, 'g');
            content = content.replace(regex, replacements[key]);
        });

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('Updated:', filePath);
          modifiedFiles++;
        }
      }
    });
  }
});

console.log(`Updated ${modifiedFiles} files.`);

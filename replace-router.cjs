const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      let newC = c
        .replace(/import \{ Link \} from 'react-router-dom';/g, "import Link from 'next/link';")
        .replace(/<Link to=/g, '<Link href=')
        .replace(/import \{ useLocation \} from 'react-router-dom';/g, "import { usePathname } from 'next/navigation';");
      if (c !== newC) fs.writeFileSync(p, newC);
    }
  });
}

walk('src');
console.log('done replacing router');

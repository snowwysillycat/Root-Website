const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, '..', 'Root-dbot', 'commands');
const outputPath = path.join(__dirname, 'src', 'data', 'commands.json');

function getCommands(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getCommands(filePath));
        } else if (file.endsWith('.js')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');

                const nameMatch = content.match(/name:\s*['"]((?:\\.|[^'"])+)['"]/);
                const descMatch = content.match(/description:\s*['"]((?:\\.|[^'"])+)['"]/);

                if (nameMatch) {
                    const category = path.basename(path.dirname(filePath));
                    results.push({
                        name: nameMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"'),
                        description: descMatch ? descMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"') : 'No description provided.',
                        category: category.charAt(0).toUpperCase() + category.slice(1)
                    });
                }
            } catch (err) {
                console.error(`Error parsing ${file}:`, err);
            }
        }
    });

    return results;
}

console.log('Extracting commands from:', commandsPath);

if (!fs.existsSync(commandsPath)) {
    console.error('Commands directory not found!');
    process.exit(1);
}

const commands = getCommands(commandsPath);

commands.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(commands, null, 4));

console.log(`Successfully extracted ${commands.length} commands to ${outputPath}`);

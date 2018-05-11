const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs      = require('fs');

let settings = {};


if(fs.existsSync('settings.json')) {
  settings = JSON.parse(fs.readFileSync('settings.json'));
}
else {
  console.error('Settings file has not been created or is inaccesible. Exiting....');
  return;
}



let locked = false;
let lastUser = 0;
let rijmID = 0;
let timeOut = null;


// if database has no rows, seed with some data
const insertData = function () {
  db.get("SELECT COUNT(*) as count FROM rijmpies", function(err, row) {
    if(row['count'] === 0) {
      db.run("INSERT INTO rijmpies (tekst, rijmID, userID, userName, discriminator) VALUES ('Rijmpie1 xd', 1, '119042542766391654', 'Kefkef123', '0001'),('Rijmpie2 xd', 1, '119042542766391123', 'Kefkef123', '0001'),('Rijmpie3 xd', 1, '119042542766391987', 'Kefkef123', '0001'),('Rijmpie4 xd', 1, '119042542766391456', 'Kefkef123', '0001')");
    }
  });
};

const createTables = function () {
  db.run("CREATE TABLE IF NOT EXISTS rijmpies (tekst TEXT, rijmID INT, userID TEXT, userName TEXT, discriminator TEXT)", insertData)
};

const rhymeTimeOut = function (user) {
  if(locked === true && lastUser === user.id) {
    client.channels.get(settings.channel).send(`${user} heeft te lang gedaan over het rijmen, de volgende mag nu rijmen`);
    user.send('Je hebt er te lang over gedaan, de volgende persoon mag nu rijmen');
    locked = false;
    lastUser = 0;
  }
};

const db = new sqlite3.Database('rijm.sqlite3', createTables);


const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // disalow bots from issuing commands
  if(msg.author.bot) {
    return;
  }

  // server or dm
  if(msg.channel.type == 'dm'){
    if(msg.author.id !== lastUser) {
      msg.reply('Jij bent niet aan de beurt!');
      return;
    }
    else {
      // some validation
      let regex = /^[a-zA-Z\u00C0-\u017F 0-9 .\-'",?!]+$/;

      if(msg.content.length < 10 || msg.content.length > 150 || msg.content.match(regex) == null) {
        msg.reply('Je rijmpie moet minimaal 10 tekens bevatten en mag maximaal 150 geldige karakters bevatten.');
      }
      else {
        client.clearTimeout(timeOut);

        db.run('INSERT INTO rijmpies (tekst, rijmID, userID, userName, discriminator) VALUES (?, ?, ?, ?, ?)',[
          msg.content,
          rijmID,
          msg.author.id,
          msg.author.username,
          msg.author.discriminator
        ]);

        msg.reply('Je rijmpje is geaccepteerd, vriendelijk bedankt.');

        client.channels.get(settings.channel).send(`${msg.author} heeft een rijmpje gedaan, de volgende is nu aan de beurt, gebruik \`${settings.commandPrefix}rijm\``)

        locked = false;
      }
    }
  }
  else {
    if (msg.content === settings.commandPrefix +'ping') {

      msg.reply('Pong!');
    }
    else if(msg.content === settings.commandPrefix + 'rijm') {
      // check if someone else is still rhyming
      if(!locked) {
        db.all("SELECT tekst, userID FROM rijmpies ORDER BY ROWID DESC LIMIT 2", function(err, rows) {
          console.log(rows);
          if(lastUser === msg.author.id) {
            msg.channel.send('Jij bent net geweest, eerst mag iemand anders rijmen.');
          }
          else {
            msg.channel.send('Je hebt een DM ontvangen om mee te doen met rijmen.').then(message => message.delete(10000)).catch(console.error);

            msg.author.send(`De mensen voor jou hebben dit gerijmd:\n${rows[1].tekst}\n${rows[0].tekst}\nRijm de volgende regel af met een bericht in dit DM-gesprek.`);
            locked = true;
            lastUser = msg.author.id;

            timeOut = client.setTimeout(rhymeTimeOut, settings.timeOutSeconds * 1000, msg.author);
          }
        });
      }
      else {
        msg.channel.send('Iemand anders is nog bezig met rijmen!').then(message => message.delete(10000)).catch(console.error);
      }
    }
    else if(msg.content === settings.commandPrefix + 'resultaat') {
      // only certain roles may execute this command
      if(msg.member.roles.find(role => settings.adminRoles.includes(role.name))) {
        // let embed = new Discord.RichEmbed({
        //   embed: {
        //     color: '#f4a442',
        //     title: 'Rijmresultaten',
        //     description: 'Rijmpjes die gedaan zijn:',
        //     footer: {
        //       text: 'Gemaakt door: Kefkef123#0001'
        //     },
        //     timestamp: new Date()
        //   }
        // });
        //
        // embed.setColor('#f4a442');

        db.all("SELECT tekst, userName, discriminator FROM rijmpies ORDER BY ROWID ASC", function(err, rows) {


          let message = '```';

          for(let i = 0; i < rows.length; i++) {
            let row = rows[i];

            message += `${row['userName']}#${row['discriminator']}`.padEnd(37, ' ') + ` ${row['tekst']}\n`

            if((i+1)%10 == 0) {
              message += '```';

              msg.channel.send(message);

              message = '```';
            }

            if(i == rows.length - 1) {
              message += '```';

              msg.channel.send(message);
            }
          }



        });
      }
      else {
        msg.channel.send('Jij bent geen admin jij mag niet');
      }
    }
  }
});

client.login(settings.token);

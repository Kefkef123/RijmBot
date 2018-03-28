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
      let regex = /^[a-zA-Z\u00C0-\u017F .-]+$/;

      if(msg.content.length < 10 || msg.content.length > 150 || msg.content.match(regex) == null) {
        msg.reply('Je rijmpie moet minimaal 10 tekens bevatten en mag maximaal 150 geldige karakters bevatten.');
      }
      else {
        msg.reply('lit');

        console.log(client.guilds[0]);

        client.guilds[0].channels.first().send(`${msg.author.username}${msg.author.discriminator} heeft een rijmpje gedaan, de volgende is aan de beurt!`);

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
          }
        });
      }
      else {
        msg.channel.send('Iemand anders is nog bezig met rijmen!').then(message => message.delete(10000)).catch(console.error);
      }
    }
  }
});

client.login(settings.token);

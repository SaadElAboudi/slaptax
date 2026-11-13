const characters=require('../../shared/characters.json');
function publicAvatar(user){const id=user?.progression?.cosmetics?.avatar;return characters.some(c=>c.id===id)?id:'spark';}
module.exports={publicAvatar};

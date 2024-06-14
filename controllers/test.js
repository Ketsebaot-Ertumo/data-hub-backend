// const transliteration = require('transliteration');

// function convertAmharicToEnglish(req, res) {
//   const { name } = req.body;
//   const englishName = transliteration.transliterate(name);
//   const response = {
//     amharicName: name,
//     englishName: englishName,
//   };
//   res.json(response);
// }

// module.exports = {
//   convertAmharicToEnglish,
// };

const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Customer = require('../models/customerModel')(sequelize, DataTypes);
const { Op } = require('sequelize');


// function convertAmharicToEnglish(req, res) {
//   const { name } = req.body;
function convertAmharicToEnglish(name) {
  
 const amharicAlphabet = {
  // 'ሀ': 'ha', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'haa', 'ሄ': 'hee', 'ህ': 'he', 'ሆ': 'ho',
    'ሀ': 'ha', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
    'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo',
    'ሏ': 'lwa', 'ሐ': 'ha', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h',
    'ሖ': 'ho', 'ሗ': 'hwa', 'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me',
    'ም': 'm', 'ሞ': 'mo', 'ሟ': 'mwa', 'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa',
    'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so', 'ሧ': 'swa', 'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri',
    'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro', 'ሯ': 'rwa', 'ሰ': 'se', 'ሱ': 'su',
    'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so', 'ሷ': 'swa', 'ሸ': 'she',
    'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho', 'ሿ': 'shwa',
    'ቀ': 'qe', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qe', 'ቅ': 'q', 'ቆ': 'qo',
    'ቈ': 'qwa', 'ቊ': 'qwi', 'ቋ': 'qwa', 'ቌ': 'qwe', 'ቍ': 'qwe', 'ቐ': 'qe', 'ቑ': 'qu',
    'ቒ': 'qi', 'ቓ': 'qa', 'ቔ': 'qee', 'ቕ': 'q', 'ቖ': 'qo', 'ቘ': 'qwa', 'ቚ': 'qwi',
    'ቛ': 'qwa', 'ቜ': 'qwe', 'ቝ': 'qwe', 'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba',
    'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo', 'ቧ': 'bwa', 'ቨ': 've', 'ቩ': 'vu', 'ቪ': 'vi',
    'ቫ': 'va', 'ቬ': 've', 'ቭ': 'v', 'ቮ': 'vo', 'ቯ': 'vwa', 'ተ': 'te', 'ቱ': 'tu',
    'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to', 'ቷ': 'twa', 'ቸ': 'che',
    'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho', 'ቿ': 'chwa',
    'ኀ': 'ha', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
    'ኈ': 'hwa', 'ኊ': 'hwi', 'ኋ': 'hwa', 'ኌ': 'hwee', 'ኍ': 'hwe', 'ነ': 'ne', 'ኑ': 'nu',
    'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no', 'ኗ': 'nwa', 'ኘ': 'gne',
    'ኙ': 'gnu', 'ኚ': 'gni', 'ኛ': 'gna', 'ኜ': 'gne', 'ኝ': 'gne', 'ኞ': 'gno', 'ኟ': 'gnwa',
    'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'e', 'ኦ': 'o',
    'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
    'ኰ': 'kwa', 'ኲ': 'kwi', 'ኳ': 'kwa', 'ኴ': 'kwe', 'ኵ': 'kwe', 'ኸ': 'he', 'ኹ': 'hu',
    'ኺ': 'hi', 'ኻ': 'ha', 'ኼ': 'he', 'ኽ': 'h', 'ኾ': 'ho', 'ወ': 'we', 'ዉ': 'wu',
    'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo', 'ዏ': 'waa', 'ዐ': 'a',
    'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'e', 'ዖ': 'o', 'ዘ': 'ze',
    'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo', 'ዟ': 'zwa',
    'ዠ': 'zhe', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhe', 'ዥ': 'zh', 'ዦ': 'zho',
    'ዧ': 'zhwa', 'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y',
    'ዮ': 'yo', 'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd',
    'ዶ': 'do', 'ዷ': 'dwa', 'ዸ': 'je', 'ዹ': 'ju', 'ዺ': 'ji', 'ዻ': 'ja', 'ዼ': 'je',
    'ዽ': 'j', 'ዾ': 'jo', 'ዿ': 'jwa', 'ጀ': 'ge', 'ጁ': 'gu', 'ጂ': 'gi', 'ጃ': 'ga',
    'ጄ': 'ge', 'ጅ': 'ge', 'ጆ': 'go', 'ጇ': 'gwa', 'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi',
    'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go', 'ጐ': 'gwa', 'ጒ': 'gwi', 'ጓ': 'gwa',
    'ጔ': 'gwe', 'ጕ': 'gwe', 'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te',
    'ጥ': 't', 'ጦ': 'to', 'ጧ': 'twa', 'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha',
    'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho', 'ጯ': 'chwa', 'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi',
    'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po', 'ጷ': 'pwa', 'ጸ': 'tse', 'ጹ': 'tsu',
    'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso', 'ጿ': 'tswa', 'ፀ': 'tse',
    'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso', 'ፈ': 'fe',
    'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo', 'ፏ': 'fwa',
    'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po',
    'ፗ': 'pwa'
  };
  // var name = name.replace(/^(?![A-Za-z\u1200-\u137F\/\s])+/g, '');
  // var pattern = /_+[a-zA-Z0-9]+/g;
  // var name = name.replace(pattern, '').replace(/^[_\s]+|[_\s]+$/g, '');
  // console.log('Name',name)

  let englishName = '';
  for (let i = 0; i < name.length; i++) {
    const character = name[i];
    if (amharicAlphabet.hasOwnProperty(character)) {
      englishName += amharicAlphabet[character];
    } else {
      englishName += character;
    }
  }
  if(isAmharicName(name) && !isEnglishName(name) ){
    // if (isAmharicName(name).isAmharic && !isEnglishName(name)) {
    // var response = {
    //   amharicName: name,
    //   englishName: englishName,
    // };
    var Name = englishName+"("+name +")" ;
  }else{
   var Name = name;
  }
  // res.status(200).json({success:true,response,full_name});
  // console.log(Name);
  return Name;
}


function isAmharicName(name) {
  const amharicRegex = /[\u1200-\u137F]/; // Range of Unicode characters for Amharic script
  // const cleanedName = name.replace(/[^\u1200-\u137F]+/g, '');
  // const cleanedName = name.replace(/^[^A-Za-z\u1200-\u137F]+/, '');
  // const cleanedName = name.replace(/[^ \u1200-\u137F]+/g, '');
  // console.log('cleanedName',cleanedName);
  return amharicRegex.test(name);
  // const isAmharic = amharicRegex.test(cleanedName);
  // return {
  //   cleanedName: cleanedName,
  //   isAmharic: isAmharic
  // };
}

function isEnglishName(name) {
  const englishRegex = /[A-Za-z]/; // Regular expression to match English letters
  const cleanedName = name.replace(/[^A-Za-z]+/g, '');
  // console.log('cleanedName',cleanedName);
  // console.log('new',englishRegex.test(name))
  // return englishRegex.test(cleanedName);
  return englishRegex.test(name);
}

// function isAmharicName(name) {
//   const amharicRegex = /[\u1200-\u137F]/; // Range of Unicode characters for Amharic script

//   // Remove Unicode escape sequences except for special characters
//   const cleanedName = name.replace(/_x([\dA-F]{4})_/g, (match, p1) => {
//     const unicode = String.fromCharCode(parseInt(p1, 16));
//     return unicode;
//   });

//   return amharicRegex.test(cleanedName);
// }



// exports.changeAllNames = async (req,res) => {
async function changeAllNames(req,res) {
  try{
    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    // const pageNumber = 1;
    // const pageSize = 173554;

    const customers = await Customer.findAll({
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize
    });

    // const customers = await Customer.findAll();
    for (const row of customers) {
        if(row.dependet_full_name){
          row.dependet_full_name = convertAmharicToEnglish(row.dependet_full_name);
        }
        if(row.full_name){
          row.full_name = convertAmharicToEnglish(row.full_name);
        }
        // console.log(row)
        await row.save();
    }
    res.status(200).json({success:true,message: 'successfully changed all names.'})
  }catch(err){
    console.log(err)
  }
}



// exports.changeAllNames = async (req,res) => {
  async function changeAll(req,res) {
    try{
      // Pagination parameters
      const { page, limit } = req.query;
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 20;
      // const pageNumber = 1;
      // const pageSize = 173554;
  
      const customers = await Customer.findAll({
        offset: (pageNumber - 1) * pageSize,
        limit: pageSize
      });
  
      // const customers = await Customer.findAll();
      for (const row of customers) {
          if(row.dependet_full_name){
            // var name = name.replace(/^(?![A-Za-z\u1200-\u137F\/\s])+/g, '');
            var pattern = /_+[a-zA-Z0-9]+/g;
            customers.dependet_full_name = row.dependet_full_name.replace(pattern, '').replace(/^[_\s]+|[_\s]+$/g, '');
          }
          if(row.full_name){
            // var name = name.replace(/^(?![A-Za-z\u1200-\u137F\/\s])+/g, '');
            var pattern = /_+[a-zA-Z0-9]+/g;
            customers.full_name = row.full_name.replace(pattern, '').replace(/^[_\s]+|[_\s]+$/g, '');
          }
          await customers.save();
      }
      res.status(200).json({success:true,message: 'successfully changed all names.'})
    }catch(err){
      console.log(err)
    }
  }

module.exports = {
  convertAmharicToEnglish, isAmharicName,isEnglishName, changeAllNames, changeAll
};
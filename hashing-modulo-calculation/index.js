
hashCode = function (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash;
    }
    return hash;
};

const maxSession = 32
const inputString = "1234";

const hashValue = hashCode(inputString);

console.log(`Input String - ${inputString}`); 
console.log(`Hash Value - ${hashValue}`); 
console.log(`SessionId - ${Math.abs(hashValue)%32}`); 
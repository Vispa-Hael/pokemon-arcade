/** RFC 4180 reader, including embedded newlines and doubled quotes. */
export function parseCsv(text:string):Record<string,string>[] {
 const rows:string[][]=[];let row:string[]=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}
 if(quoted)throw Error('Unterminated CSV field');if(value||row.length){row.push(value);rows.push(row);}const header=rows.shift();if(!header)throw Error('Empty CSV');return rows.map(values=>{if(values.length!==header.length)throw Error('CSV column mismatch');return Object.fromEntries(header.map((key,i)=>[key,values[i]]));});
}

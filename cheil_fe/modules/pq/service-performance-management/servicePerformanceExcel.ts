import type { ServicePerformanceImportRow } from "./api";

export const columns = [
 ["constructionNo","공사번호"],["client","발주청"],["serviceName","용역명"],
 ["serviceCategory","업역분류"],["detailField","세부분야"],["serviceFeeThousand","용역비(천원)"],
 ["serviceStartDate","용역시작일"],["serviceEndDate","용역완료일"],["shareRate","지분율(%)"],
 ["serviceAmountMillion","용역금액(백만원)"],["score","평점"],["evaluationEndDate","평가종료일"],
] as const;
const numberFields = new Set<string>(["serviceFeeThousand","shareRate","serviceAmountMillion","score"]);
const dateFields = new Set<string>(["serviceStartDate","serviceEndDate","evaluationEndDate"]);
function text(value:unknown):string {
 if(value==null) return "";
 if(value instanceof Date) return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
 if(typeof value==="object"){
  const v=value as {text?:string;result?:unknown;richText?:{text:string}[]};
  if(v.result!==undefined) return text(v.result);
  if(v.text!==undefined) return v.text.trim();
  if(v.richText) return v.richText.map(x=>x.text).join("").trim();
 }
 return String(value).trim();
}
function number(value:string,row:number,label:string):number|null {
 if(!value) return null;
 const parsed=Number(value.replaceAll(",","").replaceAll("%","").trim());
 if(!Number.isFinite(parsed)||parsed<0) throw new Error(`${row}행 ${label}: 숫자 형식이 올바르지 않습니다.`);
 return parsed;
}
function date(value:string,row:number,label:string):string {
 if(!value) return "";
 const compact=value.replace(/[-./\s]/g,"");
 if(!/^\d{8}$/.test(compact)) throw new Error(`${row}행 ${label}: 날짜 형식이 올바르지 않습니다.`);
 const y=Number(compact.slice(0,4)),m=Number(compact.slice(4,6)),d=Number(compact.slice(6,8));
 const parsed=new Date(y,m-1,d);
 if(parsed.getFullYear()!==y||parsed.getMonth()+1!==m||parsed.getDate()!==d)
  throw new Error(`${row}행 ${label}: 유효하지 않은 날짜입니다.`);
 return compact;
}
export async function readServicePerformanceExcel(file:File):Promise<ServicePerformanceImportRow[]> {
 const { Workbook } = await import("exceljs-community/dist/exceljs.min.js");
 const book=new Workbook();
 await book.xlsx.load(await file.arrayBuffer());
 const sheet=book.worksheets[0];
 if(!sheet) throw new Error("엑셀 시트가 없습니다.");
 const header=new Map<string,number>();
 sheet.getRow(1).eachCell((cell,index)=>header.set(text(cell.value).replace(/\s/g,""),index));
 const missing=columns.filter(([,label])=>!header.has(label.replace(/\s/g,"")));
 if(missing.length) throw new Error(`필수 컬럼이 없습니다: ${missing.map(([,label])=>label).join(", ")}`);
 const rows:ServicePerformanceImportRow[]=[];
 for(let index=2;index<=sheet.rowCount;index++){
  const raw=columns.map(([,label])=>text(sheet.getRow(index).getCell(header.get(label.replace(/\s/g,""))!).value));
  if(raw.every(value=>!value)) continue;
  const result:Record<string,string|number|null>={};
  columns.forEach(([field,label],i)=>{result[field]=numberFields.has(field)?number(raw[i],index,label):
   dateFields.has(field)?date(raw[i],index,label):raw[i];});
  if(!result.constructionNo||!result.serviceName) throw new Error(`${index}행: 공사번호와 용역명은 필수입니다.`);
  if(typeof result.shareRate==="number"&&result.shareRate>100) throw new Error(`${index}행: 지분율은 100 이하여야 합니다.`);
  rows.push(result as ServicePerformanceImportRow);
 }
 if(!rows.length) throw new Error("등록할 데이터 행이 없습니다.");
 if(rows.length>5000) throw new Error("한 번에 5000행까지만 업로드할 수 있습니다.");
 return rows;
}

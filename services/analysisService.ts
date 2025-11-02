import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { RequirementAnalysis, RequirementDocument } from '../types';

// Interface cho document lưu trong Firestore (có thêm metadata)
export interface SavedAnalysis extends RequirementAnalysis {
  id?: string; // Firestore document ID
  userId: string;
  documentName: string;
  documentType: string;
  documentSize: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Lưu RequirementAnalysis vào Firestore
 */
export async function saveAnalysis(
  userId: string,
  analysis: RequirementAnalysis,
  document: RequirementDocument
): Promise<string> {
  try {
    const analysisRef = await addDoc(collection(db, 'requirement_analyses'), {
      userId,
      documentId: analysis.documentId,
      documentName: document.fileName,
      documentType: document.fileType,
      documentSize: document.size,
      analyzedAt: analysis.analyzedAt,
      summary: analysis.summary,
      functionalRequirements: analysis.functionalRequirements,
      nonFunctionalRequirements: analysis.nonFunctionalRequirements,
      conflicts: analysis.conflicts,
      testabilityScores: analysis.testabilityScores,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return analysisRef.id;
  } catch (error) {
    throw new Error(
      `Error saving analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lấy danh sách analyses của user, sắp xếp theo createdAt desc
 */
export async function getUserAnalyses(userId: string): Promise<SavedAnalysis[]> {
  try {
    const q = query(
      collection(db, 'requirement_analyses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      documentId: doc.data().documentId,
      analyzedAt: doc.data().analyzedAt,
      summary: doc.data().summary,
      functionalRequirements: doc.data().functionalRequirements,
      nonFunctionalRequirements: doc.data().nonFunctionalRequirements,
      conflicts: doc.data().conflicts,
      testabilityScores: doc.data().testabilityScores,
      userId: doc.data().userId,
      documentName: doc.data().documentName,
      documentType: doc.data().documentType,
      documentSize: doc.data().documentSize,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as SavedAnalysis[];
  } catch (error) {
    throw new Error(
      `Error fetching analyses: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lấy một analysis cụ thể theo ID
 */
export async function getAnalysisById(analysisId: string): Promise<SavedAnalysis | null> {
  try {
    const docRef = doc(db, 'requirement_analyses', analysisId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        documentId: data.documentId,
        analyzedAt: data.analyzedAt,
        summary: data.summary,
        functionalRequirements: data.functionalRequirements,
        nonFunctionalRequirements: data.nonFunctionalRequirements,
        conflicts: data.conflicts,
        testabilityScores: data.testabilityScores,
        userId: data.userId,
        documentName: data.documentName,
        documentType: data.documentType,
        documentSize: data.documentSize,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as SavedAnalysis;
    }

    return null;
  } catch (error) {
    throw new Error(
      `Error fetching analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Xóa một analysis
 */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'requirement_analyses', analysisId));
  } catch (error) {
    throw new Error(
      `Error deleting analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}


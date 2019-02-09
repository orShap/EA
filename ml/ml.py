import pandas as pd
from sklearn.model_selection import train_test_split
data = pd.read_csv('ml.csv')
#print("\n")
#print data.head()
y = pd.DataFrame(data={
'a': data.a,
'b': data.b,
'c': data.c,
'd': data.d,
'e': data.e,
'f': data.f
})
columns=[
'a', 
'b', 
'c', 
'd', 
'e', 
'f' 
]
x = data.drop(columns=columns)
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25)
#print "\nX_train:\n"
#print(x_train.head())
#print x_train.shape
#print "\nX_test:\n"
#print(x_test.head())
#print x_test.shape
def myAccuracy(columns, y_test, predictions, format):
	if format == 1:
		predictions = predictions.toarray()
	sum = 0.0;
	TPsum = 0.0;
	total = 0.0;
	TPtotal = 0.0;
	colIndex = 0;
	for col in columns:
		rowIndex = 0;
		for curr in y_test[col]:
			total += 1;
			if predictions[rowIndex][colIndex] == curr:
				sum += 1;
				if predictions[rowIndex][colIndex] == 1:
					TPsum += 1;
			if predictions[rowIndex][colIndex] == 1:
				TPtotal += 1;
			rowIndex += 1;
		colIndex += 1;
	return (str(sum*100/total) + ' TP:' + str(TPsum*100/TPtotal))



from sklearn.multiclass import OneVsRestClassifier
from sklearn.svm import SVC
from sklearn import tree
from sklearn.metrics import accuracy_score
from scipy.sparse import csr_matrix, lil_matrix
classifier = tree.DecisionTreeClassifier()
#classifier = OneVsRestClassifier(SVC(kernel='linear'))
# Note that this classifier can throw up errors when handling sparse matrices.
x_train = lil_matrix(x_train).toarray()
y_train = lil_matrix(y_train).toarray()
x_test = lil_matrix(x_test).toarray()
classifier.fit(x_train, y_train)							# train
predictions = classifier.predict(x_test)					# predict
print("Accuracy = ", accuracy_score(y_test,predictions), myAccuracy(columns, y_test, predictions, 0)) 	# accuracy









from sklearn import tree
from sklearn import neighbors
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
#iris = load_iris()
#x = iris.data
#y = iris.target
#x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=.5)
clrTree = tree.DecisionTreeClassifier()
clrTree = clrTree.fit(x_train, y_train)
outTree = clrTree.predict(x_test)
clrKN = neighbors.KNeighborsClassifier()
clrKN = clrKN.fit(x_train, y_train)
outKN = clrKN.predict(x_test)
# Prediction accuracy
print("Accuracy for Decision Tree Classifier: " + str(accuracy_score(y_test, outTree)*100)+"%")
print("Accuracy for KNeighbors Classifier: " + str(accuracy_score(y_test, outKN)*100)+"%") 



#from skmultilearn.adapt import MLkNN
#from sklearn.metrics import accuracy_score
#from scipy.sparse import csr_matrix, lil_matrix
#classifier = MLkNN(k=len(columns))
## Note that this classifier can throw up errors when handling sparse matrices.
#x_train = lil_matrix(x_train).toarray()
#y_train = lil_matrix(y_train).toarray()
#x_test = lil_matrix(x_test).toarray()
#classifier.fit(x_train, y_train)							# train
#predictions = classifier.predict(x_test)					# predict
#print("Accuracy = ", accuracy_score(y_test,predictions), myAccuracy(columns, y_test, predictions, 1)) 	# accuracy
#
#
#
#
#from sklearn.linear_model import LogisticRegression
#from sklearn.naive_bayes import GaussianNB
#from skmultilearn.problem_transform import LabelPowerset
#from sklearn.metrics import accuracy_score
#classifierLOG = LabelPowerset(LogisticRegression())
#classifierGNB = LabelPowerset(GaussianNB())
#classifierLOG.fit(x_train, y_train) 						# train
#classifierGNB.fit(x_train, y_train) 						# train
#predictionsLOG = classifierLOG.predict(x_test) 				# predict
#predictionsGNB = classifierGNB.predict(x_test) 				# predict
#print("Accuracy = ",accuracy_score(y_test,predictionsLOG), myAccuracy(columns, y_test, predictionsLOG, 1)) 	# accuracy
#print("Accuracy = ",accuracy_score(y_test,predictionsGNB), myAccuracy(columns, y_test, predictionsGNB, 1)) 	# accuracy
#
#
#
#
#from skmultilearn.problem_transform import ClassifierChain
#from sklearn.linear_model import LogisticRegression
#from sklearn.naive_bayes import GaussianNB
#classifierLOG = ClassifierChain(LogisticRegression())
#classifierGNB = ClassifierChain(GaussianNB())
#classifierLOG.fit(x_train, y_train)
#classifierGNB.fit(x_train, y_train)
#predictionsLOG = classifierLOG.predict(x_test)
#predictionsGNB = classifierGNB.predict(x_test)
#print("Accuracy = ",accuracy_score(y_test,predictionsLOG), myAccuracy(columns, y_test, predictionsLOG, 1)) 	# accuracy
#print("Accuracy = ",accuracy_score(y_test,predictionsGNB), myAccuracy(columns, y_test, predictionsGNB, 1)) 	# accuracy
#
#
#
#from skmultilearn.problem_transform import BinaryRelevance
#from sklearn.naive_bayes import GaussianNB
#classifier = BinaryRelevance(GaussianNB())
#classifier.fit(x_train, y_train)
#predictions = classifier.predict(x_test)
#print("Accuracy = ",accuracy_score(y_test,predictions), myAccuracy(columns, y_test, predictions, 1))
#
#
#
#
##print(y_test)
##print(predictions)
